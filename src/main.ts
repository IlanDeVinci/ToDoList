import express, { NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import { authenticate } from "./middleware/authenticate.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(
	cors({
		origin: "http://localhost:3001",
		credentials: true,
	})
);
app.use(express.json());

// Static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api", authRoutes);
app.use("/api/tasks", authenticate, taskRoutes);

// Root route
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Protected route
app.get("/api/protected", authenticate, (req: any, res) => {
	const user = req.user;
	res.json({ message: `Hello, ${user.user_metadata.first_name}` });
});

// Global error handler - Fixed signature
app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: NextFunction
	) => {
		console.error("Unhandled error:", err);
		res.status(500).json({ error: "Something went wrong!" });
	}
);

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
