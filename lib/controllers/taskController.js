import { createTask, getTasks, updateTask, deleteTask, } from "../services/taskService.js";
export const createNewTask = async (req, res) => {
    const { title, description, deadline } = req.body;
    const user = req.user;
    if (!title || !description) {
        console.warn("Task creation failed: Missing title or description.");
        res.status(400).json({ error: "Title and description are required." });
        return;
    }
    // Validate deadline if provided
    if (deadline) {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            console.warn("Invalid deadline format:", deadline);
            res.status(400).json({ error: "Invalid deadline format." });
            return;
        }
        if (deadlineDate < new Date()) {
            console.warn("Deadline is in the past:", deadline);
            res.status(400).json({ error: "Deadline must be in the future." });
            return;
        }
    }
    try {
        const task = await createTask(user.id, title, description, deadline);
        res.status(201).json({ message: "Task created successfully.", task });
    }
    catch (error) {
        console.error("Task creation error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
};
export const getAllTasks = async (req, res) => {
    const user = req.user;
    try {
        const tasks = await getTasks(user.id);
        res.status(200).json({ tasks });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
};
export const updateExistingTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline, completed } = req.body;
    const user = req.user;
    if (!id) {
        res.status(400).json({ error: "Task ID is required." });
        return;
    }
    try {
        // Validate the update payload
        const updates = {};
        if (title !== undefined)
            updates.title = title;
        if (description !== undefined)
            updates.description = description;
        if (deadline !== undefined)
            updates.deadline = deadline;
        if (completed !== undefined)
            updates.completed = completed;
        const task = await updateTask(user.id, id, updates);
        res.status(200).json({ message: "Task updated successfully.", task });
    }
    catch (error) {
        console.error("Task update error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
};
export const deleteExistingTask = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        await deleteTask(user.id, id);
        res.status(200).json({ message: "Task deleted successfully." });
    }
    catch (error) {
        console.error("Task deletion error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
};
export const updateTaskCompletion = async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    const user = req.user;
    if (typeof completed !== "boolean") {
        res.status(400).json({ error: "Completed status must be a boolean" });
        return;
    }
    try {
        const task = await updateTask(user.id, id, { completed });
        const action = completed ? "completed" : "uncompleted";
        res.status(200).json({
            message: `Task ${action} successfully`,
            task,
        });
    }
    catch (error) {
        console.error("Task completion update error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred" });
        }
    }
};
