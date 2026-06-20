import { App, Modal, Setting } from 'obsidian';

export class LinkedOpsGridsModal extends Modal {
	private linkedFiles: string[];
	private onLink: () => void;
	private onUnlink: (path: string) => void;

	constructor(
		app: App,
		linkedFiles: string[],
		onLink: () => void,
		onUnlink: (path: string) => void,
	) {
		super(app);
		this.linkedFiles = linkedFiles;
		this.onLink = onLink;
		this.onUnlink = onUnlink;
	}

	onOpen(): void {
		this.setTitle('Linked Ops Grids');
		this.renderContent();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderContent(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('Link Ops Grid')
					.setCta()
					.onClick(() => {
						this.close();
						this.onLink();
					});
			});

		if (this.linkedFiles.length === 0) {
			contentEl.createEl('p', {
				text: 'No Ops Grids linked yet.',
				cls: 'priority-command-empty-linked',
			});
			return;
		}

		for (const path of this.linkedFiles) {
			const basename = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
			new Setting(contentEl)
				.setName(basename)
				.setDesc(path)
				.addExtraButton(btn => {
					btn.setIcon('trash')
						.setTooltip('Unlink')
						.onClick(() => {
							this.onUnlink(path);
							this.linkedFiles = this.linkedFiles.filter(p => p !== path);
							this.renderContent();
						});
				});
		}
	}
}
