import { stringifyYaml } from 'obsidian';
import { CURRENT_VERSION } from '../constants';
import type { CategoryDef, Task, PriorityCommandData } from '../types';

export function serializePriorityCommandData(data: PriorityCommandData): string {
	const frontmatter = buildFrontmatter(data.categories);
	const table = buildTable(data.tasks);
	return `${frontmatter}\n${table}`;
}

function buildFrontmatter(categories: CategoryDef[]): string {
	const categoryData = categories.map(cat =>
		cat.color ? { name: cat.name, color: cat.color } : cat.name,
	);
	const obj: Record<string, unknown> = {
		'priority-command': true,
		'priority-command-version': CURRENT_VERSION,
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

	return `# Priority Command\n\n${header}\n${separator}\n${rows.join('\n')}\n`;
}

function escapeCell(value: string): string {
	return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
