import { App, TFile } from 'obsidian';

export function renderFileHeader(
	container: HTMLElement,
	file: TFile | null,
	app: App,
): void {
	const header = container.createDiv({ cls: 'priority-command-file-header' });

	const basename = file?.basename ?? 'Untitled';
	const titleEl = header.createEl('h1', {
		cls: 'priority-command-file-title',
		text: basename,
	});

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
