export const VIEW_TYPE_OPS_GRID = 'ops-grid-view';
export const VIEW_TYPE_PRIORITY_COMMAND = 'priority-command-view';

export const OPS_GRID_KEY = 'ops-grid';
export const OPS_GRID_VERSION_KEY = 'ops-grid-version';
export const PRIORITY_COMMAND_KEY = 'priority-command';
export const PRIORITY_COMMAND_VERSION_KEY = 'priority-command-version';
export const CURRENT_VERSION = 1;

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Aborted'] as const;
export const PRIORITIES = ['Overdue', 'High Priority', 'Flexible', 'Completed', 'Aborted'] as const;

export const DEFAULT_CATEGORY_COLOR = '#7a7a7a';
export const CATEGORY_COLOR_PRESETS = [
	'#e03e3e', '#d9730d', '#dfab01', '#0f7b6c',
	'#0b6e99', '#6940a5', '#ad1a72', '#7a7a7a',
];

export const OPS_GRID_TEMPLATE = `---
ops-grid: true
ops-grid-version: 1
item-categories:
  - General
---

# Ops Grid

| Item Category | Task Description | Due Date | Task Status | To-Do Date |
|---|---|---|---|---|
`;

export const PRIORITY_COMMAND_TEMPLATE = `---
priority-command: true
priority-command-version: 1
linked-files: []
---

# Priority Command
`;
