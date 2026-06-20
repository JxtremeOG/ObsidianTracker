import { todayString } from '../model/PriorityCalculator';
import type { CategoryDef } from '../types';

export function applyCategoryColor(
	cell: HTMLElement,
	categoryName: string,
	categories: CategoryDef[],
): void {
	const cat = categories.find(c => c.name === categoryName);
	if (!cat?.color) return;
	cell.style.borderLeft = `3px solid ${cat.color}`;
}

export function applyDueDateColor(cell: HTMLElement, daysLeft: number | null): void {
	if (daysLeft === null) return;

	const maxDays = 30;
	const clamped = Math.max(0, Math.min(daysLeft, maxDays));
	const ratio = clamped / maxDays;
	// Red (0°) → Green (120°) with 50% lightness
	const hue = Math.round(ratio * 120);
	cell.style.backgroundColor = `hsla(${hue}, 70%, 45%, 0.15)`;
}

export function applyTodoDateColor(cell: HTMLElement, todoDate: string): void {
	if (!todoDate) return;
	const today = todayString();

	if (todoDate < today) {
		cell.classList.add('todo-past');
	} else if (todoDate === today) {
		cell.classList.add('todo-today');
	} else {
		cell.classList.add('todo-future');
	}
}

export function priorityCssClass(priority: string): string {
	return priority.toLowerCase().replace(/\s+/g, '-');
}
