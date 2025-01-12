import express from "express";
import {
	createNewTask,
	getAllTasks,
	updateExistingTask,
	deleteExistingTask,
	updateTaskCompletion,
} from "../controllers/taskController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/", authenticate, createNewTask);
router.get("/", authenticate, getAllTasks);
router.put("/:id", authenticate, updateExistingTask);
router.delete("/:id", authenticate, deleteExistingTask);
router.patch("/:id", authenticate, updateTaskCompletion);

export default router;
