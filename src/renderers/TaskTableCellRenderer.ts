import { setIcon } from 'obsidian';
import { TASK_STATUSES } from '../constants';
import {
	applyCategoryColor,
	applyDueDateColor,
	applyTodoDateColor,
	priorityCssClass,
} from '../utils/TaskTableStyler';
import type { CategoryDef, ComputedTask, RenderCallbacks, Task } from '../types';

export function renderCategoryCell(
	row: HTMLTableRowElement,
	task: ComputedTask,
	index: number,
	categories: CategoryDef[],
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-category' });
	const select = cell.createEl('select');

	for (const cat of categories) {
		const option = select.createEl('option', { text: cat.name, attr: { value: cat.name } });
		if (cat.name === task.category) option.selected = true;
	}

	const categoryNames = categories.map(c => c.name);
	if (!categoryNames.includes(task.category) && task.category) {
		const option = select.createEl('option', { text: task.category, attr: { value: task.category } });
		option.selected = true;
	}

	applyCategoryColor(cell, task.category, categories);

	select.addEventListener('change', () => {
		callbacks.onTaskChange(index, buildUpdatedTask(task, { category: select.value }));
	});
}

export function renderDescriptionCell(
	row: HTMLTableRowElement,
	task: ComputedTask,
	index: number,
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-description' });
	const input = cell.createEl('input', {
		type: 'text',
		attr: { value: task.description, placeholder: 'Task description...' },
	});

	input.addEventListener('change', () => {
		callbacks.onTaskChange(index, buildUpdatedTask(task, { description: input.value }));
	});
}

export function renderDueDateCell(
	row: HTMLTableRowElement,
	task: ComputedTask,
	index: number,
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-due-date' });
	const input = cell.createEl('input', {
		type: 'date',
		attr: { value: task.dueDate },
	});

	applyDueDateColor(cell, task.daysLeft);

	input.addEventListener('change', () => {
		callbacks.onTaskChange(index, buildUpdatedTask(task, { dueDate: input.value }));
	});
}

export function renderStatusCell(
	row: HTMLTableRowElement,
	task: ComputedTask,
	index: number,
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-status' });
	const select = cell.createEl('select');

	for (const status of TASK_STATUSES) {
		const option = select.createEl('option', { text: status, attr: { value: status } });
		if (status === task.status) option.selected = true;
	}

	select.addEventListener('change', () => {
		callbacks.onTaskChange(index, buildUpdatedTask(task, { status: select.value as Task['status'] }));
	});
}

export function renderPriorityCell(row: HTMLTableRowElement, task: ComputedTask): void {
	row.createEl('td', {
		text: task.priority,
		cls: `priority-command-cell-priority priority-${priorityCssClass(task.priority)}`,
	});
}

export function renderTodoDateCell(
	row: HTMLTableRowElement,
	task: ComputedTask,
	index: number,
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-todo-date' });
	const input = cell.createEl('input', {
		type: 'date',
		attr: { value: task.todoDate },
	});

	applyTodoDateColor(cell, task.todoDate);

	input.addEventListener('change', () => {
		callbacks.onTaskChange(index, buildUpdatedTask(task, { todoDate: input.value }));
	});
}

export function renderDaysLeftCell(row: HTMLTableRowElement, task: ComputedTask): void {
	const text = task.daysLeft !== null ? String(task.daysLeft) : '—';
	row.createEl('td', {
		text,
		cls: 'priority-command-cell-days-left',
	});
}

export function renderDeleteCell(
	row: HTMLTableRowElement,
	index: number,
	callbacks: RenderCallbacks,
): void {
	const cell = row.createEl('td', { cls: 'priority-command-cell-delete' });
	const btn = cell.createEl('button', {
		cls: 'priority-command-delete-btn clickable-icon',
		attr: { 'aria-label': 'Delete task' },
	});
	setIcon(btn, 'trash');
	btn.addEventListener('click', () => callbacks.onTaskDelete(index));
}

export function renderSourceCell(row: HTMLTableRowElement, task: ComputedTask): void {
	const basename = task.sourceFile
		? task.sourceFile.split('/').pop()?.replace(/\.md$/, '') ?? task.sourceFile
		: '—';
	row.createEl('td', {
		text: basename,
		cls: 'priority-command-cell-source',
	});
}

function buildUpdatedTask(task: ComputedTask, updates: Partial<Task>): Task {
	return {
		category: updates.category ?? task.category,
		description: updates.description ?? task.description,
		dueDate: updates.dueDate ?? task.dueDate,
		status: updates.status ?? task.status,
		todoDate: updates.todoDate ?? task.todoDate,
	};
}
