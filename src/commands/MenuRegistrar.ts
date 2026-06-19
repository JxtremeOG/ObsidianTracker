import { TFile, TFolder } from 'obsidian';
import { FRONTMATTER_KEY, VIEW_TYPE_TASK_PLANNER } from '../constants';
import { createPriorityCommandFile } from './FileCreator';
import { openAsMarkdown, openAsPriorityCommand } from './ViewSwitcher';
import type PriorityCommandPlugin from '../main';

export function registerMenus(plugin: PriorityCommandPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu, file, source, leaf) => {
			if (file instanceof TFolder) {
				menu.addItem(item => {
					item.setTitle('New task planner')
						.setIcon('list-checks')
						.onClick(() => createPriorityCommandFile(plugin.app, file));
				});
				return;
			}

			if (!(file instanceof TFile) || file.extension !== 'md') return;

			if (!isPriorityCommandFile(plugin, file)) return;

			const activeView = leaf?.view;
			const isInPlannerView = activeView?.getViewType() === VIEW_TYPE_TASK_PLANNER;

			if (isInPlannerView && leaf) {
				menu.addItem(item => {
					item.setTitle('Open as Markdown')
						.setIcon('file-text')
						.onClick(() => openAsMarkdown(plugin, leaf, file));
				});
			} else {
				menu.addItem(item => {
					item.setTitle('Open as task planner')
						.setIcon('list-checks')
						.onClick(() => {
							const targetLeaf = leaf ?? plugin.app.workspace.getLeaf(false);
							openAsPriorityCommand(plugin, targetLeaf, file);
						});
				});
			}
		}),
	);
}

function isPriorityCommandFile(plugin: PriorityCommandPlugin, file: TFile): boolean {
	const cache = plugin.app.metadataCache.getFileCache(file);
	return cache?.frontmatter?.[FRONTMATTER_KEY] === true;
}
