import { setIcon } from 'obsidian';
import type { RenderCallbacks } from '../types';

export function renderToolbar(
	container: HTMLElement,
	callbacks: RenderCallbacks,
	hasPending: boolean,
	isPriorityCommand: boolean,
	linkedFiles?: string[],
): void {
	const toolbar = container.createDiv({ cls: 'priority-command-toolbar' });

	const addBtn = toolbar.createEl('button', {
		cls: 'priority-command-add-btn',
		text: 'Add task',
	});
	setIcon(addBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'plus');
	if (hasPending) {
		addBtn.disabled = true;
		addBtn.title = 'Fill out the current new task first';
	}
	if (isPriorityCommand && (!linkedFiles || linkedFiles.length === 0)) {
		addBtn.disabled = true;
		addBtn.title = 'Link an Ops Grid first';
	}
	addBtn.addEventListener('click', () => callbacks.onTaskAdd());

	const catBtn = toolbar.createEl('button', {
		cls: 'priority-command-cat-btn',
		text: 'Edit categories',
	});
	setIcon(catBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'settings');
	if (isPriorityCommand && (!linkedFiles || linkedFiles.length === 0)) {
		catBtn.disabled = true;
		catBtn.title = 'Link an Ops Grid first';
	}
	catBtn.addEventListener('click', () => callbacks.onCategoriesEdit());

	if (isPriorityCommand) {
		const manageBtn = toolbar.createEl('button', {
			cls: 'priority-command-manage-btn',
			text: 'Linked Ops Grids',
		});
		setIcon(manageBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'link');
		manageBtn.addEventListener('click', () => callbacks.onManageLinkedGrids?.());
	}
}
