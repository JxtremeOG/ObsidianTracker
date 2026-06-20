import { App, TFile } from 'obsidian';
import { renderBarChart, renderPieChart } from './ChartRenderer';
import type { ComputedTask } from '../types';

export function renderFileHeader(
	container: HTMLElement,
	file: TFile | null,
	app: App,
	tasks?: ComputedTask[],
): void {
	const header = container.createDiv({ cls: 'priority-command-file-header' });

	const left = header.createDiv({ cls: 'priority-command-header-left' });

	const basename = file?.basename ?? 'Untitled';
	const titleEl = left.createEl('h1', {
		cls: 'priority-command-file-title',
		text: basename,
	});

	if (tasks && tasks.length > 0) {
		const charts = header.createDiv({ cls: 'priority-command-header-charts' });
		charts.appendChild(renderBarChart(tasks));
		charts.appendChild(renderPieChart(tasks));
	}

	titleEl.contentEditable = 'true';
	titleEl.spellcheck = false;

	let pendingRename: string | null = null;

	const scheduleRename = () => {
		const newName = titleEl.textContent?.trim() ?? '';
		if (!newName || !file) return;
		if (newName === file.basename) return;

		pendingRename = newName;
	};

	titleEl.addEventListener('blur', () => {
		scheduleRename();
		if (pendingRename && file) {
			const cleanName = pendingRename.replace(/\.md$/i, '');
 			const newPath = file.path.replace(/[^/]+\.md$/i, `${cleanName}.md`);
 			void app.vault.rename(file, newPath);
			pendingRename = null;
		}
	});

	titleEl.addEventListener('keydown', (evt: KeyboardEvent) => {
		if (evt.key === 'Enter') {
			evt.preventDefault();
			titleEl.blur();
		}
	});
}
