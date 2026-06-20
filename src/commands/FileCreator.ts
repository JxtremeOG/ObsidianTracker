import { App, TFile, TFolder } from 'obsidian';
import {
	OPS_GRID_TEMPLATE,
	PRIORITY_COMMAND_TEMPLATE,
	VIEW_TYPE_OPS_GRID,
	VIEW_TYPE_PRIORITY_COMMAND,
} from '../constants';

export async function createOpsGridFile(app: App, folder: TFolder): Promise<TFile> {
	return createFile(app, folder, 'Untitled Ops Grid', OPS_GRID_TEMPLATE, VIEW_TYPE_OPS_GRID);
}

export async function createPriorityCommandFile(app: App, folder: TFolder): Promise<TFile> {
	return createFile(app, folder, 'Untitled Priority Command', PRIORITY_COMMAND_TEMPLATE, VIEW_TYPE_PRIORITY_COMMAND);
}

async function createFile(
	app: App,
	folder: TFolder,
	baseName: string,
	template: string,
	viewType: string,
): Promise<TFile> {
	const filePath = generateUniqueFilePath(app, folder, baseName);
	const file = await app.vault.create(filePath, template);

	const leaf = app.workspace.getLeaf(false);
	await leaf.setViewState({
		type: viewType,
		state: { file: file.path },
	});

	return file;
}

function generateUniqueFilePath(app: App, folder: TFolder, baseName: string): string {
	let candidate = folder.isRoot()
		? `${baseName}.md`
		: `${folder.path}/${baseName}.md`;

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
