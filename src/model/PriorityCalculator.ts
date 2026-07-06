import type { Task, ComputedTask, Priority } from '../types';

export function computeAndSortTasks(tasks: Task[]): ComputedTask[] {
	const today = todayString();
	const computed = tasks.map((task, index) => computeTask(task, index, today));
	return sortTasks(computed);
}

function computeTask(task: Task, originalIndex: number, today: string): ComputedTask {
	const daysLeft = computeDaysLeft(task.dueDate, today);
	const priority = computePriority(task, today);
	return { ...task, originalIndex, priority, daysLeft };
}

function computePriority(task: Task, today: string): Priority {
	if (task.status === 'Completed') return 'Completed';
	if (task.status === 'Aborted') return 'Aborted';
	if (task.dueDate && task.dueDate < today) return 'Overdue';
	if (task.dueDate === today || (task.todoDate && task.todoDate <= today)) return 'High Priority';
	return 'Flexible';
}

function computeDaysLeft(dueDate: string, today: string): number | null {
	if (!dueDate) return null;
	const due = new Date(dueDate + 'T00:00:00');
	const now = new Date(today + 'T00:00:00');
	const diffMs = due.getTime() - now.getTime();
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function sortTasks(tasks: ComputedTask[]): ComputedTask[] {
	const priorityRank: Record<Priority, number> = {
		'Overdue': 0,
		'High Priority': 1,
		'Flexible': 2,
		'Completed': 3,
		'Aborted': 4,
	};

	return [...tasks].sort((a, b) => {
		const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
		if (rankDiff !== 0) return rankDiff;

		const aDate = earliestDate(a);
		const bDate = earliestDate(b);

		// Treat a missing date as "last" within the same priority so sorting stays deterministic.
		if (aDate == null && bDate == null) return a.category.localeCompare(b.category);
		if (aDate == null) return 1;
		if (bDate == null) return -1;
		if (aDate !== bDate) return aDate < bDate ? -1 : 1;

		return a.category.localeCompare(b.category);
	});
}

function earliestDate(task: Task): string | null {
	const dates = [task.dueDate, task.todoDate].filter((d): d is string => d !== '');
	if (dates.length === 0) return null;
	return dates.reduce((min, d) => (d < min ? d : min));
}

function todayString(): string {
	const d = new Date();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Re-export for use by the renderer
export { computeDaysLeft, todayString };
