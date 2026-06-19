export const VIEW_TYPE_TASK_PLANNER = 'priority-command-view';
export const FRONTMATTER_KEY = 'priority-command';
export const FRONTMATTER_VERSION_KEY = 'priority-command-version';
export const CURRENT_VERSION = 1;

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
export const PRIORITIES = ['Overdue', 'High Priority', 'Flexible', 'Completed'] as const;

export const DEFAULT_CATEGORY_COLOR = '#7a7a7a';
export const CATEGORY_COLOR_PRESETS = [
	'#e03e3e', '#d9730d', '#dfab01', '#0f7b6c',
	'#0b6e99', '#6940a5', '#ad1a72', '#7a7a7a',
];

export const DEFAULT_TEMPLATE = `---
priority-command: true
priority-command-version: 1
item-categories:
  - General
---

# Priority Command

| Item Category | Task Description | Due Date | Task Status | To-Do Date |
|---|---|---|---|---|
`;
