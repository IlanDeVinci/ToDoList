import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import supabase from "./utils/init.js";
import { registerUser } from "./register.js";
import { loginUser } from "./login.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware to enable CORS
app.use(cors({
    origin: "http://localhost:3001", // Update this to your frontend's URL
    credentials: true,
}));
// Middleware to parse JSON
app.use(express.json());
// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));
// Root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});
// API route to register a new user
app.post("/api/register", async (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        console.log(`Registering user: ${email}`);
        const data = await registerUser(email, password, firstName, lastName);
        res.status(201).json(data);
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
});
// API route to login a user
app.post("/api/login", async (req, res, next) => {
    const { email, password } = req.body;
    try {
        console.log(`Logging in user: ${email}`);
        const data = await loginUser(email, password);
        if (data.session && data.user) {
            const firstName = data.user.user_metadata?.first_name || "User";
            res.status(200).json({ token: data.session.access_token, firstName });
        }
        else {
            res.status(400).json({ error: "Invalid login response." });
        }
    }
    catch (error) {
        console.error("Login error:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
});
// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.warn("Authentication failed: No Authorization header.");
        res.status(401).json({ error: "Unauthorized: No token provided." });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        console.warn("Authentication failed: No token found after Bearer.");
        res.status(401).json({ error: "Unauthorized: Invalid token format." });
        return;
    }
    console.log(`Authenticating token: ${token}`);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        console.error("Authentication error:", error);
        res.status(401).json({ error: "Unauthorized: Invalid token." });
        return;
    }
    // Attach user to request object
    req.user = data.user;
    next();
};
// API route to create a new task
app.post("/api/tasks", authenticate, async (req, res) => {
    const { title, description, deadline } = req.body;
    if (!title || !description) {
        console.warn("Task creation failed: Missing title or description.");
        return res
            .status(400)
            .json({ error: "Title and description are required." });
    }
    // Validate deadline if provided
    let parsedDeadline = null;
    if (deadline) {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            console.warn("Invalid deadline format:", deadline);
            return res.status(400).json({ error: "Invalid deadline format." });
        }
        parsedDeadline = deadlineDate.toISOString();
        // Optional: Ensure deadline is in the future
        const now = new Date();
        if (deadlineDate < now) {
            console.warn("Deadline is in the past:", parsedDeadline);
            return res
                .status(400)
                .json({ error: "Deadline must be in the future." });
        }
    }
    try {
        const user = req.user;
        console.log(`User ${user.id} is creating a new task: ${title}`);
        const { data, error } = await supabase.from("todo").insert({
            user_id: user.id,
            title: title,
            description: description,
            deadline: parsedDeadline, // Store the deadline
        });
        if (error) {
            console.error("Task creation error:", error);
            return res.status(500).json({ error: "Failed to create task." });
        }
        res
            .status(201)
            .json({ message: "Task created successfully.", task: data });
    }
    catch (error) {
        console.error("Unexpected error during task creation:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
// API route to update task completion status
app.patch("/api/tasks/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "Invalid completed status." });
    }
    try {
        const user = req.user;
        console.log(`User ${user.id} is updating task ${id} to completed: ${completed}`);
        const updateData = { completed };
        if (completed) {
            updateData.completion_date = new Date().toISOString();
        }
        else {
            updateData.completion_date = null;
        }
        const { data, error } = await supabase
            .from("todo")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", user.id); // Ensure users can only update their own tasks
        if (error) {
            console.error("Task update error:", error);
            return res.status(500).json({ error: "Failed to update task." });
        }
        res
            .status(200)
            .json({ message: "Task updated successfully.", task: data });
    }
    catch (error) {
        console.error("Unexpected error during task update:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
// API route to update a task
app.put("/api/tasks/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline } = req.body;
    try {
        const user = req.user;
        // Fetch the task to verify ownership and completion status
        const { data: taskData, error: fetchError } = await supabase
            .from("todo")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();
        if (fetchError) {
            console.error("Error fetching task:", fetchError);
            return res.status(500).json({ error: "Failed to fetch task." });
        }
        if (taskData.completed) {
            return res.status(400).json({ error: "Cannot edit a completed task." });
        }
        // Prepare the update payload
        const updatePayload = {};
        if (title)
            updatePayload.title = title;
        if (description)
            updatePayload.description = description;
        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({ error: "Invalid deadline format." });
            }
            updatePayload.deadline = deadlineDate.toISOString();
        }
        // Update the task
        const { data, error } = await supabase
            .from("todo")
            .update(updatePayload)
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            console.error("Task update error:", error);
            return res.status(500).json({ error: "Failed to update task." });
        }
        res
            .status(200)
            .json({ message: "Task updated successfully.", task: data });
    }
    catch (error) {
        console.error("Unexpected error during task update:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
app.delete("/api/tasks/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const user = req.user;
        // Fetch the task to verify ownership and completion status
        const { data: taskData, error: fetchError } = await supabase
            .from("todo")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();
        if (fetchError) {
            console.error("Error fetching task:", fetchError);
            return res.status(500).json({ error: "Failed to fetch task." });
        }
        if (taskData.completed) {
            return res
                .status(400)
                .json({ error: "Cannot delete a completed task." });
        }
        // Delete the task
        const { data, error } = await supabase
            .from("todo")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            console.error("Task deletion error:", error);
            return res.status(500).json({ error: "Failed to delete task." });
        }
        res
            .status(200)
            .json({ message: "Task deleted successfully.", task: data });
    }
    catch (error) {
        console.error("Unexpected error during task deletion:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
// API route to get tasks for the authenticated user
app.get("/api/tasks", authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        console.log(`Fetching tasks for user ID: ${user.id}`);
        const { data, error } = await supabase
            .from("todo")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        console.log(data);
        if (error) {
            console.error("Error fetching tasks:", error);
            return res.status(500).json({ error: "Failed to fetch tasks." });
        }
        console.log(`Fetched ${data.length} tasks for user ID: ${user.id}`);
        res.status(200).json({ tasks: data });
    }
    catch (error) {
        console.error("Unexpected error fetching tasks:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
// Example of a protected route
app.get("/api/protected", authenticate, async (req, res) => {
    const user = req.user;
    console.log(`Accessing protected route for user: ${user.id}`);
    res.json({ message: `Hello, ${user.user_metadata.first_name}` });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send("Something went wrong!");
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
