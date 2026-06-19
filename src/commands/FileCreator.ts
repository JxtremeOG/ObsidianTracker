import { App, TFile, TFolder } from 'obsidian';
import { DEFAULT_TEMPLATE, VIEW_TYPE_TASK_PLANNER } from '../constants';

export async function createPriorityCommandFile(app: App, folder: TFolder): Promise<TFile> {
	const filePath = generateUniqueFilePath(app, folder);
	const file = await app.vault.create(filePath, DEFAULT_TEMPLATE);

	const leaf = app.workspace.getLeaf(false);
	await leaf.setViewState({
		type: VIEW_TYPE_TASK_PLANNER,
		state: { file: file.path },
	});

	return file;
}

function generateUniqueFilePath(app: App, folder: TFolder): string {
	const baseName = 'Untitled Task planner';
	let candidate = `${folder.path}/${baseName}.md`;

	if (folder.isRoot()) {
		candidate = `${baseName}.md`;
	}

	if (!app.vault.getAbstractFileByPath(candidate)) {
		return candidate;
	}

	let counter = 1;
	while (true) {
		const numbered = folder.isRoot()
			? `${baseName} ${counter}.md`
			: `${folder.path}/${baseName} ${counter}.md`;

		if (!app.vault.getAbstractFileByPath(numbered)) {
			return numbered;
		}
		counter++;
	}
}
