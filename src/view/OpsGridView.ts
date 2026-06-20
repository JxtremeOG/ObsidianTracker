import { TextFileView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_OPS_GRID } from '../constants';
import { parseOpsGridData } from '../model/TaskParser';
import { serializeOpsGridData } from '../model/TaskSerializer';
import { computeAndSortTasks } from '../model/PriorityCalculator';
import { renderFileHeader } from '../renderers/FileHeaderRenderer';
import { renderTaskTable } from '../renderers/TaskTableRenderer';
import { CategoryEditorModal } from './CategoryEditorModal';
import type { Task, OpsGridData, RenderCallbacks } from '../types';
import type PriorityCommandPlugin from '../main';

export class OpsGridView extends TextFileView {
	private plugin: PriorityCommandPlugin;
	private gridData: OpsGridData = { categories: [], tasks: [] };
	private pendingNewTaskIndex: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: PriorityCommandPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_OPS_GRID;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'Ops Grid';
	}

	getIcon(): string {
		return 'list-checks';
	}

	getViewData(): string {
		return this.data;
	}

	setViewData(data: string, clear: boolean): void {
		this.data = data;
		if (clear) {
			this.clear();
		}
		this.gridData = parseOpsGridData(data);
		this.render();
	}

	clear(): void {
		this.contentEl.empty();
		this.gridData = { categories: [], tasks: [] };
		this.pendingNewTaskIndex = null;
	}

	private render(): void {
		this.contentEl.empty();

		const computed = computeAndSortTasks(this.gridData.tasks);
		renderFileHeader(this.contentEl, this.file, this.app, computed);
		const callbacks: RenderCallbacks = {
			onTaskChange: (index, updatedTask) => this.handleTaskChange(index, updatedTask),
			onTaskAdd: () => this.handleTaskAdd(),
			onTaskDelete: (index) => this.handleTaskDelete(index),
			onCategoriesEdit: () => this.handleCategoriesEdit(),
		};

		const resolveCategories = () => this.gridData.categories;
		renderTaskTable(this.contentEl, computed, resolveCategories, callbacks, this.pendingNewTaskIndex, false);
	}

	private handleTaskChange(index: number, updatedTask: Task): void {
		const previousTask = this.gridData.tasks[index];
		if (previousTask) {
			updatedTask = applyDateSync(previousTask, updatedTask);
		}

		this.gridData.tasks[index] = updatedTask;

		if (this.pendingNewTaskIndex === index && isTaskPopulated(updatedTask)) {
			this.pendingNewTaskIndex = null;
		}

		this.saveAndRerender();
	}

	private handleTaskAdd(): void {
		if (this.pendingNewTaskIndex !== null) return;

		const defaultCategory = this.gridData.categories[0]?.name ?? '';
		this.gridData.tasks.push({
			category: defaultCategory,
			description: '',
			dueDate: '',
			status: 'Not Started',
			todoDate: '',
		});
		this.pendingNewTaskIndex = this.gridData.tasks.length - 1;
		this.saveAndRerender();
	}

	private handleTaskDelete(index: number): void {
		if (this.pendingNewTaskIndex === index) {
			this.pendingNewTaskIndex = null;
		} else if (this.pendingNewTaskIndex !== null && index < this.pendingNewTaskIndex) {
			this.pendingNewTaskIndex--;
		}

		this.gridData.tasks.splice(index, 1);
		this.saveAndRerender();
	}

	private handleCategoriesEdit(): void {
		new CategoryEditorModal(this.app, this.gridData.categories, (updated) => {
			this.gridData.categories = updated;
			this.saveAndRerender();
		}).open();
	}

	private saveAndRerender(): void {
		this.data = serializeOpsGridData(this.gridData);
		this.requestSave();
		this.render();
	}
}

function isTaskPopulated(task: Task): boolean {
	return task.description.trim() !== ''
		&& task.dueDate !== ''
		&& task.todoDate !== '';
}

function applyDateSync(previous: Task, updated: Task): Task {
	const dueDateChanged = updated.dueDate !== previous.dueDate && updated.dueDate !== '';

	if (dueDateChanged && !previous.todoDate) {
		updated = { ...updated, todoDate: updated.dueDate };
	}

	if (dueDateChanged && updated.todoDate && updated.dueDate < updated.todoDate) {
		updated = { ...updated, todoDate: updated.dueDate };
	}

	return updated;
}
