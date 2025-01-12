import supabase from "../utils/init.js";
export const createTask = async (userId, title, description, deadline) => {
    if (!userId)
        throw new Error("User ID is required");
    if (!title.trim())
        throw new Error("Title cannot be empty");
    if (!description.trim())
        throw new Error("Description cannot be empty");
    try {
        if (!title || !description) {
            throw new Error("Title and description are required.");
        }
        console.log("Creating task with data:", {
            userId,
            title,
            description,
            deadline,
        });
        let parsedDeadline = null;
        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                throw new Error("Invalid deadline format.");
            }
            parsedDeadline = deadlineDate.toISOString();
            if (deadlineDate < new Date()) {
                throw new Error("Deadline must be in the future.");
            }
        }
        const { data, error } = await supabase
            .from("todo")
            .insert({
            user_id: userId,
            title,
            description,
            deadline: parsedDeadline,
            completed: false,
        })
            .select()
            .single();
        if (error) {
            console.error("Supabase error:", error);
            throw new Error(`Failed to create task: ${error.message}`);
        }
        if (!data) {
            throw new Error("No data returned from task creation");
        }
        console.log("Task created successfully:", data);
        return data;
    }
    catch (error) {
        console.error("Error in createTask:", error);
        throw error;
    }
};
export const getTasks = async (userId) => {
    const { data, error } = await supabase
        .from("todo")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error)
        throw error;
    return data;
};
export const updateTask = async (userId, taskId, updates) => {
    if (!userId)
        throw new Error("User ID is required");
    if (!taskId)
        throw new Error("Task ID is required");
    // First verify task exists and belongs to user
    const { data: existingTask, error: fetchError } = await supabase
        .from("todo")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single();
    if (fetchError || !existingTask) {
        throw new Error("Task not found or access denied");
    }
    // If we're only updating completion status, allow it regardless of current completion status
    if (Object.keys(updates).length === 1 && "completed" in updates) {
        const updatePayload = {
            completed: updates.completed,
            completion_date: updates.completed ? new Date().toISOString() : null,
        };
        const { data, error } = await supabase
            .from("todo")
            .update(updatePayload)
            .eq("id", taskId)
            .eq("user_id", userId)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            throw new Error("Failed to update task");
        return data;
    }
    // For other updates, check if task is completed
    if (existingTask.completed) {
        throw new Error("Cannot edit a completed task");
    }
    // Validate update fields
    if (updates.title !== undefined && !updates.title.trim()) {
        throw new Error("Title cannot be empty");
    }
    if (updates.description !== undefined && !updates.description.trim()) {
        throw new Error("Description cannot be empty");
    }
    // Prepare update payload
    const updatePayload = { ...updates };
    // Handle completion status update
    if (updates.completed !== undefined) {
        updatePayload.completed = updates.completed;
        updatePayload.completion_date = updates.completed
            ? new Date().toISOString()
            : null;
    }
    // Handle other updates
    if (updates.deadline) {
        const deadlineDate = new Date(updates.deadline);
        if (isNaN(deadlineDate.getTime())) {
            throw new Error("Invalid deadline format");
        }
        updatePayload.deadline = deadlineDate.toISOString();
    }
    const { data, error } = await supabase
        .from("todo")
        .update(updatePayload)
        .eq("id", taskId)
        .eq("user_id", userId)
        .select()
        .single();
    if (error)
        throw error;
    if (!data)
        throw new Error("Failed to update task");
    return data;
};
export const deleteTask = async (userId, taskId) => {
    // First verify task exists and is not completed
    const { data: taskData, error: fetchError } = await supabase
        .from("todo")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single();
    if (fetchError)
        throw new Error("Failed to fetch task");
    if (taskData.completed)
        throw new Error("Cannot delete a completed task");
    // Delete the task
    const { error } = await supabase
        .from("todo")
        .delete()
        .eq("id", taskId)
        .eq("user_id", userId);
    if (error)
        throw error;
};
