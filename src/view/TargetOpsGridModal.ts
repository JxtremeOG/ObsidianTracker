import { SuggestModal, App } from 'obsidian';

interface LinkedFileOption {
	path: string;
	basename: string;
}

export class TargetOpsGridModal extends SuggestModal<LinkedFileOption> {
	private options: LinkedFileOption[];
	private onSelect: (path: string) => void;

	constructor(app: App, linkedPaths: string[], onSelect: (path: string) => void) {
		super(app);
		this.options = linkedPaths.map(path => ({
			path,
			basename: path.split('/').pop()?.replace(/\.md$/, '') ?? path,
		}));
		this.onSelect = onSelect;
		this.setPlaceholder('Select an Ops Grid to create the task in...');
	}

	getSuggestions(query: string): LinkedFileOption[] {
		const lowerQuery = query.toLowerCase();
		return this.options.filter(opt => opt.basename.toLowerCase().includes(lowerQuery));
	}

	renderSuggestion(option: LinkedFileOption, el: HTMLElement): void {
		el.createEl('div', { text: option.basename });
		el.createEl('small', { text: option.path, cls: 'priority-command-suggest-path' });
	}

	onChooseSuggestion(option: LinkedFileOption): void {
		this.onSelect(option.path);
	}
}
