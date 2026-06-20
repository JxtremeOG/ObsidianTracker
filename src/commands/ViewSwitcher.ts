import { MarkdownView, TFile, WorkspaceLeaf } from 'obsidian';
import { OPS_GRID_KEY, PRIORITY_COMMAND_KEY, VIEW_TYPE_OPS_GRID, VIEW_TYPE_PRIORITY_COMMAND } from '../constants';
import type PriorityCommandPlugin from '../main';

export function registerAutoOpen(plugin: PriorityCommandPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', (leaf) => {
			if (!leaf) return;
			handleLeafChange(plugin, leaf);
		}),
	);
}

function handleLeafChange(plugin: PriorityCommandPlugin, leaf: WorkspaceLeaf): void {
	const view = leaf.view;
	if (!(view instanceof MarkdownView)) return;

	const file = view.file;
	if (!file) return;

	if (plugin.forceMarkdownFiles.has(file.path)) return;

	const cache = plugin.app.metadataCache.getFileCache(file);
	if (!cache?.frontmatter) return;

	if (cache.frontmatter[OPS_GRID_KEY] === true) {
		void leaf.setViewState({
			type: VIEW_TYPE_OPS_GRID,
			state: { file: file.path },
		});
	} else if (cache.frontmatter[PRIORITY_COMMAND_KEY] === true) {
		void leaf.setViewState({
			type: VIEW_TYPE_PRIORITY_COMMAND,
			state: { file: file.path },
		});
	}
}

export function openAsMarkdown(plugin: PriorityCommandPlugin, leaf: WorkspaceLeaf, file: TFile): void {
	plugin.forceMarkdownFiles.add(file.path);
	void leaf.setViewState({
		type: 'markdown',
		state: { file: file.path },
	});
}

export function openAsOpsGrid(plugin: PriorityCommandPlugin, leaf: WorkspaceLeaf, file: TFile): void {
	plugin.forceMarkdownFiles.delete(file.path);
	void leaf.setViewState({
		type: VIEW_TYPE_OPS_GRID,
		state: { file: file.path },
	});
}

export function openAsPriorityCommand(plugin: PriorityCommandPlugin, leaf: WorkspaceLeaf, file: TFile): void {
	plugin.forceMarkdownFiles.delete(file.path);
	void leaf.setViewState({
		type: VIEW_TYPE_PRIORITY_COMMAND,
		state: { file: file.path },
	});
}
