import { Request } from "express";

export interface AuthenticatedRequest extends Request {
	user?: any;
}

export interface Task {
	id: string;
	user_id: string;
	title: string;
	description: string;
	completed: boolean;
	created_at: Date;
	completion_date?: Date;
	deadline?: Date;
}
