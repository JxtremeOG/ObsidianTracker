import type { TASK_STATUSES, PRIORITIES } from './constants';

export type TaskStatus = typeof TASK_STATUSES[number];
export type Priority = typeof PRIORITIES[number];

export interface Task {
	category: string;
	description: string;
	dueDate: string;
	status: TaskStatus;
	todoDate: string;
}

export interface ComputedTask extends Task {
	originalIndex: number;
	priority: Priority;
	daysLeft: number | null;
}

export interface CategoryDef {
	name: string;
	color: string;
}

export interface PriorityCommandData {
	categories: CategoryDef[];
	tasks: Task[];
}

export interface RenderCallbacks {
	onTaskChange: (index: number, task: Task) => void;
	onTaskAdd: () => void;
	onTaskDelete: (index: number) => void;
	onCategoriesEdit: () => void;
}
