import { parseYaml } from 'obsidian';
import { TASK_STATUSES } from '../constants';
import type { CategoryDef, Task, PriorityCommandData, TaskStatus } from '../types';

export function parsePriorityCommandData(markdown: string): PriorityCommandData {
	const frontmatter = extractFrontmatter(markdown);
	const categories = parseCategoriesFromFrontmatter(frontmatter);
	const tasks = parseTaskTable(markdown);
	return { categories, tasks };
}

function extractFrontmatter(markdown: string): Record<string, unknown> {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match?.[1]) return {};
	return parseYaml(match[1]) as Record<string, unknown>;
}

function parseCategoriesFromFrontmatter(frontmatter: Record<string, unknown>): CategoryDef[] {
	const raw = frontmatter['item-categories'];
	if (!Array.isArray(raw)) return [];

	return raw
		.map((item): CategoryDef | null => {
			if (typeof item === 'string') {
				return { name: item, color: '' };
			}
			if (typeof item === 'object' && item !== null && 'name' in item) {
				const obj = item as Record<string, unknown>;
				const name = typeof obj['name'] === 'string' ? obj['name'] : '';
				const color = typeof obj['color'] === 'string' ? obj['color'] : '';
				return { name, color };
			}
			return null;
		})
		.filter((cat): cat is CategoryDef => cat !== null);
}

function parseTaskTable(markdown: string): Task[] {
	const lines = markdown.split('\n');
	const tableStartIndex = lines.findIndex(line => line.trimStart().startsWith('|'));
	if (tableStartIndex === -1) return [];

	const tableLines: string[] = [];
 	for (let i = tableStartIndex; i < lines.length; i++) {
 		const line = lines[i]!;
 		if (!line.trimStart().startsWith('|')) break;
 		tableLines.push(line);
 	}

	// Skip header and separator rows
	const dataLines = tableLines.slice(2);

	return dataLines
		.map(parseTableRow)
		.filter((task): task is Task => task !== null);
}

function parseTableRow(line: string): Task | null {
	const cells = line
		.split('|')
		.slice(1, -1)
		.map(cell => cell.trim());

	if (cells.length < 5) return null;

	return {
		category: cells[0] ?? '',
		description: cells[1] ?? '',
		dueDate: cells[2] ?? '',
		status: validateStatus(cells[3] ?? ''),
		todoDate: cells[4] ?? '',
	};
}

function validateStatus(raw: string): TaskStatus {
	const found = TASK_STATUSES.find(s => s === raw);
	return found ?? 'Not Started';
}
