import { Plugin } from 'obsidian';
import { VIEW_TYPE_OPS_GRID, VIEW_TYPE_PRIORITY_COMMAND } from './constants';
import { OpsGridView } from './view/OpsGridView';
import { PriorityCommandView } from './view/PriorityCommandView';
import { registerMenus } from './commands/MenuRegistrar';
import { registerAutoOpen } from './commands/ViewSwitcher';

export default class PriorityCommandPlugin extends Plugin {
	forceMarkdownFiles: Set<string> = new Set();

	async onload() {
		this.registerView(
			VIEW_TYPE_OPS_GRID,
			(leaf) => new OpsGridView(leaf, this),
		);

		this.registerView(
			VIEW_TYPE_PRIORITY_COMMAND,
			(leaf) => new PriorityCommandView(leaf, this),
		);

		registerMenus(this);
		registerAutoOpen(this);
	}
}
