import { TextFileView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_TASK_PLANNER } from '../constants';
import { parsePriorityCommandData } from '../model/TaskParser';
import { serializePriorityCommandData } from '../model/TaskSerializer';
import { computeAndSortTasks } from '../model/PriorityCalculator';
import { renderTaskTable } from './TaskTableRenderer';
import { CategoryEditorModal } from './CategoryEditor';
import type { Task, PriorityCommandData, RenderCallbacks } from '../types';
import type PriorityCommandPlugin from '../main';

export class PriorityCommandView extends TextFileView {
	private plugin: PriorityCommandPlugin;
	private plannerData: PriorityCommandData = { categories: [], tasks: [] };
	private pendingNewTaskIndex: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: PriorityCommandPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TASK_PLANNER;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'Priority Command';
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
		this.plannerData = parsePriorityCommandData(data);
		this.render();
	}

	clear(): void {
		this.contentEl.empty();
		this.plannerData = { categories: [], tasks: [] };
		this.pendingNewTaskIndex = null;
	}

	private render(): void {
		this.contentEl.empty();

		const computed = computeAndSortTasks(this.plannerData.tasks);
		const callbacks: RenderCallbacks = {
			onTaskChange: (index, updatedTask) => this.handleTaskChange(index, updatedTask),
			onTaskAdd: () => this.handleTaskAdd(),
			onTaskDelete: (index) => this.handleTaskDelete(index),
			onCategoriesEdit: () => this.handleCategoriesEdit(),
		};

		renderTaskTable(this.contentEl, computed, this.plannerData.categories, callbacks, this.pendingNewTaskIndex);
	}

	private handleTaskChange(index: number, updatedTask: Task): void {
		const previousTask = this.plannerData.tasks[index];
		if (previousTask) {
			updatedTask = applyDateSync(previousTask, updatedTask);
		}

		this.plannerData.tasks[index] = updatedTask;

		if (this.pendingNewTaskIndex === index && isTaskPopulated(updatedTask)) {
			this.pendingNewTaskIndex = null;
		}

		this.saveAndRerender();
	}

	private handleTaskAdd(): void {
		if (this.pendingNewTaskIndex !== null) return;

		const defaultCategory = this.plannerData.categories[0]?.name ?? '';
		this.plannerData.tasks.push({
			category: defaultCategory,
			description: '',
			dueDate: '',
			status: 'Not Started',
			todoDate: '',
		});
		this.pendingNewTaskIndex = this.plannerData.tasks.length - 1;
		this.saveAndRerender();
	}

	private handleTaskDelete(index: number): void {
		if (this.pendingNewTaskIndex === index) {
			this.pendingNewTaskIndex = null;
		} else if (this.pendingNewTaskIndex !== null && index < this.pendingNewTaskIndex) {
			this.pendingNewTaskIndex--;
		}

		this.plannerData.tasks.splice(index, 1);
		this.saveAndRerender();
	}

	private handleCategoriesEdit(): void {
		new CategoryEditorModal(this.app, this.plannerData.categories, (updated) => {
			this.plannerData.categories = updated;
			this.saveAndRerender();
		}).open();
	}

	private saveAndRerender(): void {
		this.data = serializePriorityCommandData(this.plannerData);
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
