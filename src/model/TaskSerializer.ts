import { stringifyYaml } from 'obsidian';
import {
	CURRENT_VERSION,
	OPS_GRID_KEY,
	OPS_GRID_VERSION_KEY,
	PRIORITY_COMMAND_KEY,
	PRIORITY_COMMAND_VERSION_KEY,
} from '../constants';
import type { CategoryDef, Task, OpsGridData } from '../types';

export function serializeOpsGridData(data: OpsGridData): string {
	const frontmatter = buildOpsGridFrontmatter(data.categories);
	const table = buildTable(data.tasks);
	return `${frontmatter}\n${table}`;
}

export function serializePriorityCommandData(linkedFiles: string[]): string {
	const obj: Record<string, unknown> = {
		[PRIORITY_COMMAND_KEY]: true,
		[PRIORITY_COMMAND_VERSION_KEY]: CURRENT_VERSION,
		'linked-files': linkedFiles,
	};
	const yaml = stringifyYaml(obj).trimEnd();
	return `---\n${yaml}\n---\n\n# Priority Command\n`;
}

function buildOpsGridFrontmatter(categories: CategoryDef[]): string {
	const categoryData = categories.map(cat =>
		cat.color ? { name: cat.name, color: cat.color } : cat.name,
	);
	const obj: Record<string, unknown> = {
		[OPS_GRID_KEY]: true,
		[OPS_GRID_VERSION_KEY]: CURRENT_VERSION,
		'item-categories': categoryData,
	};
	const yaml = stringifyYaml(obj).trimEnd();
	return `---\n${yaml}\n---`;
}

function buildTable(tasks: Task[]): string {
	const header = '| Item Category | Task Description | Due Date | Task Status | To-Do Date |';
	const separator = '|---|---|---|---|---|';

	const rows = tasks.map(task =>
		`| ${escapeCell(task.category)} | ${escapeCell(task.description)} | ${task.dueDate} | ${task.status} | ${task.todoDate} |`
	);

	return `# Ops Grid\n\n${header}\n${separator}\n${rows.join('\n')}\n`;
}

function escapeCell(value: string): string {
	return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
