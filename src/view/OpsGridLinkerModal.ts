import { SuggestModal, TFile, App } from 'obsidian';
import { OPS_GRID_KEY } from '../constants';

export class OpsGridLinkerModal extends SuggestModal<TFile> {
	private excludedPaths: Set<string>;
	private onSelect: (file: TFile) => void;

	constructor(app: App, excludedPaths: string[], onSelect: (file: TFile) => void) {
		super(app);
		this.excludedPaths = new Set(excludedPaths);
		this.onSelect = onSelect;
		this.setPlaceholder('Search for an Ops Grid to link...');
	}

	getSuggestions(query: string): TFile[] {
		const lowerQuery = query.toLowerCase();
		return this.app.vault.getMarkdownFiles()
			.filter(file => {
				if (this.excludedPaths.has(file.path)) return false;
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter?.[OPS_GRID_KEY] !== true) return false;
				return file.basename.toLowerCase().includes(lowerQuery);
			});
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.createEl('div', { text: file.basename });
		el.createEl('small', { text: file.path, cls: 'priority-command-suggest-path' });
	}

	onChooseSuggestion(file: TFile): void {
		this.onSelect(file);
	}
}
