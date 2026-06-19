import { setIcon } from 'obsidian';
import type { RenderCallbacks } from '../types';

export function renderToolbar(
	container: HTMLElement,
	callbacks: RenderCallbacks,
	hasPending: boolean,
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
	addBtn.addEventListener('click', () => callbacks.onTaskAdd());

	const catBtn = toolbar.createEl('button', {
		cls: 'priority-command-cat-btn',
		text: 'Edit categories',
	});
	setIcon(catBtn.createSpan({ cls: 'priority-command-btn-icon' }), 'settings');
	catBtn.addEventListener('click', () => callbacks.onCategoriesEdit());
}
