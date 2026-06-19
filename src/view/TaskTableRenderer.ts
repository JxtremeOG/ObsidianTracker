import { priorityCssClass } from './TaskTableStyler';
import { renderToolbar } from './TaskTableToolbar';
import {
	renderCategoryCell,
	renderDescriptionCell,
	renderDueDateCell,
	renderStatusCell,
	renderPriorityCell,
	renderTodoDateCell,
	renderDaysLeftCell,
	renderDeleteCell,
} from './TaskTableCellRenderer';
import type { CategoryDef, ComputedTask, Priority, RenderCallbacks } from '../types';

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
