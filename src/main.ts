import { Plugin } from 'obsidian';
import { VIEW_TYPE_TASK_PLANNER } from './constants';
import { PriorityCommandView } from './view/PriorityCommandView';
import { registerMenus } from './commands/MenuRegistrar';
import { registerAutoOpen } from './commands/ViewSwitcher';

export default class PriorityCommandPlugin extends Plugin {
	forceMarkdownFiles: Set<string> = new Set();

	async onload() {
		this.registerView(
			VIEW_TYPE_TASK_PLANNER,
			(leaf) => new PriorityCommandView(leaf, this),
		);

		registerMenus(this);
		registerAutoOpen(this);
	}
}
