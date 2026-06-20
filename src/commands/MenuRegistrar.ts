import { TFile, TFolder } from 'obsidian';
import { OPS_GRID_KEY, PRIORITY_COMMAND_KEY, VIEW_TYPE_OPS_GRID, VIEW_TYPE_PRIORITY_COMMAND } from '../constants';
import { createOpsGridFile, createPriorityCommandFile } from './FileCreator';
import { openAsMarkdown, openAsOpsGrid, openAsPriorityCommand } from './ViewSwitcher';
import type PriorityCommandPlugin from '../main';

export function registerMenus(plugin: PriorityCommandPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu, file, source, leaf) => {
			if (file instanceof TFolder) {
				menu.addItem(item => {
					item.setTitle('New Ops Grid')
						.setIcon('list-checks')
						.onClick(() => createOpsGridFile(plugin.app, file));
				});
				menu.addItem(item => {
					item.setTitle('New Priority Command')
						.setIcon('git-merge')
						.onClick(() => createPriorityCommandFile(plugin.app, file));
				});
				return;
			}

			if (!(file instanceof TFile) || file.extension !== 'md') return;

			const cache = plugin.app.metadataCache.getFileCache(file);
			const isOpsGrid = cache?.frontmatter?.[OPS_GRID_KEY] === true;
			const isPriorityCommand = cache?.frontmatter?.[PRIORITY_COMMAND_KEY] === true;

			if (!isOpsGrid && !isPriorityCommand) return;

			const activeView = leaf?.view;
			const viewType = activeView?.getViewType();
			const isInCustomView = viewType === VIEW_TYPE_OPS_GRID || viewType === VIEW_TYPE_PRIORITY_COMMAND;

			if (isInCustomView && leaf) {
				menu.addItem(item => {
					item.setTitle('Open as Markdown')
						.setIcon('file-text')
						.onClick(() => openAsMarkdown(plugin, leaf, file));
				});
			} else if (isOpsGrid) {
				menu.addItem(item => {
					item.setTitle('Open as Ops Grid')
						.setIcon('list-checks')
						.onClick(() => {
							const targetLeaf = leaf ?? plugin.app.workspace.getLeaf(false);
							openAsOpsGrid(plugin, targetLeaf, file);
						});
				});
			} else if (isPriorityCommand) {
				menu.addItem(item => {
					item.setTitle('Open as Priority Command')
						.setIcon('git-merge')
						.onClick(() => {
							const targetLeaf = leaf ?? plugin.app.workspace.getLeaf(false);
							openAsPriorityCommand(plugin, targetLeaf, file);
						});
				});
			}
		}),
	);
}
