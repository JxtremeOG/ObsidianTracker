import { TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_PRIORITY_COMMAND } from '../constants';
import { parseOpsGridData, parsePriorityCommandData } from '../model/TaskParser';
import { serializeOpsGridData, serializePriorityCommandData } from '../model/TaskSerializer';
import { computeAndSortTasks } from '../model/PriorityCalculator';
import { renderFileHeader } from '../renderers/FileHeaderRenderer';
import { renderTaskTable } from '../renderers/TaskTableRenderer';
import { CategoryEditorModal } from './CategoryEditorModal';
import { LinkedOpsGridsModal } from './LinkedOpsGridsModal';
import { OpsGridLinkerModal } from './OpsGridLinkerModal';
import { TargetOpsGridModal } from './TargetOpsGridModal';
import type { Task, OpsGridData, ComputedTask, CategoryDef, RenderCallbacks } from '../types';
import type PriorityCommandPlugin from '../main';

interface SourceMapping {
	sourceFile: string;
	localIndex: number;
}

export class PriorityCommandView extends TextFileView {
	private plugin: PriorityCommandPlugin;
	private linkedFiles: string[] = [];
	private sourceDataMap: Map<string, OpsGridData> = new Map();
	private allTasks: Task[] = [];
	private indexMap: SourceMapping[] = [];
	private pendingNewTaskIndex: number | null = null;
	private pendingSourceFile: string | null = null;
	private renderGeneration = 0;

	constructor(leaf: WorkspaceLeaf, plugin: PriorityCommandPlugin) {
		super(leaf);
		this.plugin = plugin;

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf?.view === this && this.file) {
					void this.loadLinkedFilesAndRender().catch((err) =>
 						console.error('PriorityCommandView: failed to reload linked files', err),
 					);
				}
			}),
		);
	}

	getViewType(): string {
		return VIEW_TYPE_PRIORITY_COMMAND;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'Priority Command';
	}

	getIcon(): string {
		return 'git-merge';
	}

	getViewData(): string {
		return this.data;
	}

	setViewData(data: string, clear: boolean): void {
		this.data = data;
		if (clear) {
			this.clear();
		}
		const parsed = parsePriorityCommandData(data);
		this.linkedFiles = parsed.linkedFiles;
		void this.loadLinkedFilesAndRender();
	}

	clear(): void {
		this.contentEl.empty();
		this.linkedFiles = [];
		this.sourceDataMap.clear();
		this.allTasks = [];
		this.indexMap = [];
		this.pendingNewTaskIndex = null;
		this.pendingSourceFile = null;
	}

	private async loadLinkedFilesAndRender(): Promise<void> {
		const generation = ++this.renderGeneration;

		const sourceDataMap = new Map<string, OpsGridData>();
		const allTasks: Task[] = [];
		const indexMap: SourceMapping[] = [];
		let resolvedPendingIndex: number | null = null;

		for (const path of this.linkedFiles) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) continue;

			const content = await this.app.vault.read(file);
			if (generation !== this.renderGeneration) return;

			const gridData = parseOpsGridData(content);
			sourceDataMap.set(path, gridData);

			for (let i = 0; i < gridData.tasks.length; i++) {
				const task = { ...gridData.tasks[i]!, sourceFile: path };
				const globalIndex = allTasks.length;
				allTasks.push(task);
				indexMap.push({ sourceFile: path, localIndex: i });

				if (this.pendingSourceFile === path && i === gridData.tasks.length - 1 && this.pendingSourceFile !== null) {
					resolvedPendingIndex = globalIndex;
				}
			}
		}

		if (generation !== this.renderGeneration) return;

		this.sourceDataMap = sourceDataMap;
		this.allTasks = allTasks;
		this.indexMap = indexMap;
		this.pendingNewTaskIndex = resolvedPendingIndex;

		this.render();
	}

	private render(): void {
		this.contentEl.empty();

		renderFileHeader(this.contentEl, this.file, this.app);

		const computed = computeAndSortTasks(this.allTasks);

		const resolveCategories = (task: ComputedTask) =>
			this.sourceDataMap.get(task.sourceFile ?? '')?.categories ?? [];

		const callbacks: RenderCallbacks = {
			onTaskChange: (index, updatedTask) => this.handleTaskChange(index, updatedTask),
			onTaskAdd: () => this.handleTaskAdd(),
			onTaskDelete: (index) => this.handleTaskDelete(index),
			onCategoriesEdit: () => this.handleCategoriesEdit(),
			onManageLinkedGrids: () => this.handleManageLinkedGrids(),
		};

		renderTaskTable(
			this.contentEl,
			computed,
			resolveCategories,
			callbacks,
			this.pendingNewTaskIndex,
			true,
			this.linkedFiles,
		);
	}

	private async handleTaskChange(globalIndex: number, updatedTask: Task): Promise<void> {
		const mapping = this.indexMap[globalIndex];
		if (!mapping) return;

		const gridData = this.sourceDataMap.get(mapping.sourceFile);
		if (!gridData) return;

		const previousTask = gridData.tasks[mapping.localIndex];
		if (previousTask) {
			updatedTask = applyDateSync(previousTask, updatedTask);
		}

		gridData.tasks[mapping.localIndex] = {
			category: updatedTask.category,
			description: updatedTask.description,
			dueDate: updatedTask.dueDate,
			status: updatedTask.status,
			todoDate: updatedTask.todoDate,
		};

		if (this.pendingNewTaskIndex === globalIndex && isTaskPopulated(updatedTask)) {
			this.pendingNewTaskIndex = null;
			this.pendingSourceFile = null;
		}

		await this.saveOpsGridFile(mapping.sourceFile, gridData);
		await this.loadLinkedFilesAndRender();
	}

	private handleTaskAdd(): void {
		if (this.pendingNewTaskIndex !== null) return;
		if (this.linkedFiles.length === 0) return;

		if (this.linkedFiles.length === 1) {
			this.createTaskInOpsGrid(this.linkedFiles[0]!);
			return;
		}

		new TargetOpsGridModal(this.app, this.linkedFiles, (path) => {
			this.createTaskInOpsGrid(path);
		}).open();
	}

	private async createTaskInOpsGrid(sourceFile: string): Promise<void> {
		const gridData = this.sourceDataMap.get(sourceFile);
		if (!gridData) return;

		const defaultCategory = gridData.categories[0]?.name ?? '';
		gridData.tasks.push({
			category: defaultCategory,
			description: '',
			dueDate: '',
			status: 'Not Started',
			todoDate: '',
		});

		this.pendingSourceFile = sourceFile;
		await this.saveOpsGridFile(sourceFile, gridData);
		await this.loadLinkedFilesAndRender();
	}

	private async handleTaskDelete(globalIndex: number): Promise<void> {
		const mapping = this.indexMap[globalIndex];
		if (!mapping) return;

		if (this.pendingNewTaskIndex === globalIndex) {
			this.pendingNewTaskIndex = null;
			this.pendingSourceFile = null;
		} else if (this.pendingNewTaskIndex !== null && globalIndex < this.pendingNewTaskIndex) {
			this.pendingNewTaskIndex--;
		}

		const gridData = this.sourceDataMap.get(mapping.sourceFile);
		if (!gridData) return;

		gridData.tasks.splice(mapping.localIndex, 1);
		await this.saveOpsGridFile(mapping.sourceFile, gridData);
		await this.loadLinkedFilesAndRender();
	}

	private handleCategoriesEdit(): void {
		if (this.linkedFiles.length === 0) return;

		if (this.linkedFiles.length === 1) {
			this.editCategoriesForSource(this.linkedFiles[0]!);
			return;
		}

		new TargetOpsGridModal(this.app, this.linkedFiles, (path) => {
			this.editCategoriesForSource(path);
		}).open();
	}

	private getCategoriesForSource(sourceFile: string): CategoryDef[] {
		return this.sourceDataMap.get(sourceFile)?.categories ?? [];
	}

	private editCategoriesForSource(sourceFile: string): void {
		const categories = this.getCategoriesForSource(sourceFile);
		new CategoryEditorModal(this.app, categories, async (updated) => {
			const gridData = this.sourceDataMap.get(sourceFile);
			if (!gridData) return;
			gridData.categories = updated;
			await this.saveOpsGridFile(sourceFile, gridData);
			await this.loadLinkedFilesAndRender();
		}).open();
	}

	private handleManageLinkedGrids(): void {
		new LinkedOpsGridsModal(
			this.app,
			[...this.linkedFiles],
			() => this.openOpsGridLinker(),
			(path) => void this.handleUnlinkOpsGrid(path),
		).open();
	}

	private openOpsGridLinker(): void {
		const currentFile = this.file?.path ?? '';
		const excluded = [...this.linkedFiles, currentFile];

		new OpsGridLinkerModal(this.app, excluded, async (file) => {
			this.linkedFiles.push(file.path);
			this.savePriorityCommandFile();
			await this.loadLinkedFilesAndRender();
		}).open();
	}

	private async handleUnlinkOpsGrid(path: string): Promise<void> {
		this.linkedFiles = this.linkedFiles.filter(p => p !== path);
		this.savePriorityCommandFile();
		await this.loadLinkedFilesAndRender();
	}

	private async saveOpsGridFile(path: string, gridData: OpsGridData): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		const content = serializeOpsGridData(gridData);
		await this.app.vault.modify(file, content);
	}

	private savePriorityCommandFile(): void {
		this.data = serializePriorityCommandData(this.linkedFiles);
		this.requestSave();
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
