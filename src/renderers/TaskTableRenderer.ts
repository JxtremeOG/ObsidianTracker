import { priorityCssClass } from '../utils/TaskTableStyler';
import { renderToolbar } from './TaskTableToolbarRenderer';
import {
	renderSourceCell,
	renderCategoryCell,
	renderDescriptionCell,
	renderDueDateCell,
	renderStatusCell,
	renderPriorityCell,
	renderTodoDateCell,
	renderDaysLeftCell,
	renderDeleteCell,
} from './TaskTableCellRenderer';
import type { CategoryResolver, ComputedTask, Priority, RenderCallbacks } from '../types';

const BASE_COLUMN_HEADERS = [
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
	resolveCategories: CategoryResolver,
	callbacks: RenderCallbacks,
	pendingNewTaskIndex: number | null,
	showSourceColumn: boolean,
	linkedFiles?: string[],
): void {
	const wrapper = container.createDiv({ cls: 'priority-command-container' });
	const headers = showSourceColumn ? ['Source', ...BASE_COLUMN_HEADERS] : BASE_COLUMN_HEADERS;

	renderToolbar(wrapper, callbacks, pendingNewTaskIndex !== null, showSourceColumn, linkedFiles);

	const table = wrapper.createEl('table', { cls: 'priority-command-table' });
	renderHeader(table, headers);

	const pendingTask = pendingNewTaskIndex !== null
		? tasks.find(t => t.originalIndex === pendingNewTaskIndex) ?? null
		: null;
	const sortedTasks = tasks.filter(t => t !== pendingTask);

	renderBody(table, sortedTasks, resolveCategories, callbacks, pendingTask, headers.length, showSourceColumn);
}

function renderHeader(table: HTMLTableElement, headers: string[]): void {
	const thead = table.createEl('thead');
	const row = thead.createEl('tr');
	for (const header of headers) {
		row.createEl('th', { text: header });
	}
}

function renderBody(
	table: HTMLTableElement,
	tasks: ComputedTask[],
	resolveCategories: CategoryResolver,
	callbacks: RenderCallbacks,
	pendingTask: ComputedTask | null,
	columnCount: number,
	showSourceColumn: boolean,
): void {
	const tbody = table.createEl('tbody');

	if (pendingTask) {
		renderPriorityGroupRow(tbody, 'New task', columnCount);
		renderTaskRow(tbody, pendingTask, resolveCategories, callbacks, true, showSourceColumn);
	}

	let currentPriority: Priority | null = null;

	for (const task of tasks) {
		if (task.priority !== currentPriority) {
			currentPriority = task.priority;
			renderPriorityGroupRow(tbody, currentPriority, columnCount);
		}
		renderTaskRow(tbody, task, resolveCategories, callbacks, false, showSourceColumn);
	}

	if (tasks.length === 0 && !pendingTask) {
		tbody.createEl('tr').createEl('td', {
			text: showSourceColumn
				? 'No linked Ops Grids yet. Click "Link Ops Grid" to get started.'
				: 'No tasks yet. Click "add task" to get started.',
			attr: { colspan: String(columnCount) },
			cls: 'priority-command-empty',
		});
	}
}

function renderPriorityGroupRow(tbody: HTMLTableSectionElement, label: Priority | 'New task', columnCount: number): void {
	const row = tbody.createEl('tr', { cls: 'priority-command-group-row' });
	row.createEl('td', {
		text: label,
		attr: { colspan: String(columnCount) },
		cls: `priority-command-group-label priority-${priorityCssClass(label)}`,
	});
}

function renderTaskRow(
	tbody: HTMLTableSectionElement,
	task: ComputedTask,
	resolveCategories: CategoryResolver,
	callbacks: RenderCallbacks,
	isPending: boolean,
	showSourceColumn: boolean,
): void {
	const cls = isPending
		? 'priority-command-row priority-command-row-pending'
		: `priority-command-row priority-row-${priorityCssClass(task.priority)}`;
	const row = tbody.createEl('tr', { cls });
	const index = task.originalIndex;
	const categories = resolveCategories(task);

	if (showSourceColumn) {
		renderSourceCell(row, task);
	}

	renderCategoryCell(row, task, index, categories, callbacks);
	renderDescriptionCell(row, task, index, callbacks);
	renderDueDateCell(row, task, index, callbacks);
	renderStatusCell(row, task, index, callbacks);
	renderPriorityCell(row, task);
	renderTodoDateCell(row, task, index, callbacks);
	renderDaysLeftCell(row, task);
	renderDeleteCell(row, index, callbacks);
}
