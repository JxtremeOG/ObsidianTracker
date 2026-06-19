import { setIcon } from 'obsidian';
import { TASK_STATUSES } from '../constants';
import { todayString } from '../model/PriorityCalculator';
import type { CategoryDef, ComputedTask, Priority, RenderCallbacks, Task } from '../types';

const COLUMN_HEADERS = [
	'Item Category',
	'Task Description',
	'Due Date',
	'Task Status',
	'Priority',
	'To-Do Date',
	'Days Left',
	'',
];

export function renderTaskTable(
	container: HTMLElement,
	tasks: ComputedTask[],
	categories: CategoryDef[],
	callbacks: RenderCallbacks,
	pendingNewTaskIndex: number | null,
): void {
	const wrapper = container.createDiv({ cls: 'priority-command-container' });

	renderToolbar(wrapper, callbacks, pendingNewTaskIndex !== null);

	const table = wrapper.createEl('table', { cls: 'priority-command-table' });
	renderHeader(table);

	const pendingTask = pendingNewTaskIndex !== null
		? tasks.find(t => t.originalIndex === pendingNewTaskIndex) ?? null
		: null;
	const sortedTasks = tasks.filter(t => t !== pendingTask);

	renderBody(table, sortedTasks, categories, callbacks, pendingTask);
}

function renderToolbar(container: HTMLElement, callbacks: RenderCallbacks, hasPending: boolean): void {
	const toolbar = container.createDiv({ cls: 'priority-command-toolbar' });

	const addBtn = toolbar.createEl('button', {
		cls: 'priority-command-add-btn',
		text: 'Add task',
	});
	setIcon(addBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'plus');
	if (hasPending) {
		addBtn.disabled = true;
		addBtn.title = 'Fill out the current new task first';
	}
	addBtn.addEventListener('click', () => callbacks.onTaskAdd());

	const catBtn = toolbar.createEl('button', {
		cls: 'priority-command-cat-btn',
		text: 'Edit categories',
	});
	setIcon(catBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'settings');
	catBtn.addEventListener('click', () => callbacks.onCategoriesEdit());
}

function renderHeader(table: HTMLTableElement): void {
	const thead = table.createEl('thead');
	const row = thead.createEl('tr');
	for (const header of COLUMN_HEADERS) {
		row.createEl('th', { text: header });
	}
}

function renderBody(
	table: HTMLTableElement,
	tasks: ComputedTask[],
	categories: CategoryDef[],
	callbacks: RenderCallbacks,
	pendingTask: ComputedTask | null,
): void {
	const tbody = table.createEl('tbody');

	if (pendingTask) {
		renderPriorityGroupRow(tbody, 'New task');
		renderTaskRow(tbody, pendingTask, categories, callbacks, true);
	}

	let currentPriority: Priority | null = null;

	for (const task of tasks) {
		if (task.priority !== currentPriority) {
			currentPriority = task.priority;
			renderPriorityGroupRow(tbody, currentPriority);
		}
		renderTaskRow(tbody, task, categories, callbacks, false);
	}

	if (tasks.length === 0 && !pendingTask) {
		tbody.createEl('tr').createEl('td', {
			text: 'No tasks yet. Click "add task" to get started.',
			attr: { colspan: String(COLUMN_HEADERS.length) },
			cls: 'priority-command-empty',
		});
	}
}

function renderPriorityGroupRow(tbody: HTMLTableSectionElement, label: Priority | 'New task'): void {
	const row = tbody.createEl('tr', { cls: 'priority-command-group-row' });
	row.createEl('td', {
		text: label,
		attr: { colspan: String(COLUMN_HEADERS.length) },
		cls: `priority-command-group-label priority-${priorityCssClass(label)}`,
	});
}

function renderTaskRow(
	tbody: HTMLTableSectionElement,
	task: ComputedTask,
	categories: CategoryDef[],
	callbacks: RenderCallbacks,
	isPending: boolean,
): void {
	const cls = isPending
		? 'priority-command-row priority-command-row-pending'
		: `priority-command-row priority-row-${priorityCssClass(task.priority)}`;
	const row = tbody.createEl('tr', { cls });
	const index = task.originalIndex;

	renderCategoryCell(row, task, index, categories, callbacks);
	renderDescriptionCell(row, task, index, callbacks);
	renderDueDateCell(row, task, index, callbacks);
	renderStatusCell(row, task, index, callbacks);
	renderPriorityCell(row, task);
	renderTodoDateCell(row, task, index, callbacks);
	renderDaysLeftCell(row, task);
	renderDeleteCell(row, index, callbacks);
}

function renderCategoryCell(
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

function renderDescriptionCell(
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

function renderDueDateCell(
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

function renderStatusCell(
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

function renderPriorityCell(row: HTMLTableRowElement, task: ComputedTask): void {
	row.createEl('td', {
		text: task.priority,
		cls: `priority-command-cell-priority priority-${priorityCssClass(task.priority)}`,
	});
}

function renderTodoDateCell(
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

function renderDaysLeftCell(row: HTMLTableRowElement, task: ComputedTask): void {
	const text = task.daysLeft !== null ? String(task.daysLeft) : '—';
	row.createEl('td', {
		text,
		cls: 'priority-command-cell-days-left',
	});
}

function renderDeleteCell(
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

function applyDueDateColor(cell: HTMLElement, daysLeft: number | null): void {
	if (daysLeft === null) return;

	const maxDays = 30;
	const clamped = Math.max(0, Math.min(daysLeft, maxDays));
	const ratio = clamped / maxDays;
	// Red (0°) → Green (120°) with 50% lightness
	const hue = Math.round(ratio * 120);
	cell.style.backgroundColor = `hsla(${hue}, 70%, 45%, 0.15)`;
}

function applyTodoDateColor(cell: HTMLElement, todoDate: string): void {
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

function applyCategoryColor(cell: HTMLElement, categoryName: string, categories: CategoryDef[]): void {
	const cat = categories.find(c => c.name === categoryName);
	if (!cat?.color) return;
	cell.style.borderLeft = `3px solid ${cat.color}`;
}

function priorityCssClass(priority: string): string {
	return priority.toLowerCase().replace(/\s+/g, '-');
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
