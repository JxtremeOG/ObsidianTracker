import { App, Modal, Setting } from 'obsidian';
import { CATEGORY_COLOR_PRESETS, DEFAULT_CATEGORY_COLOR } from '../constants';
import type { CategoryDef } from '../types';

export class CategoryEditorModal extends Modal {
	private categories: CategoryDef[];
	private onSave: (categories: CategoryDef[]) => void;

	constructor(app: App, categories: CategoryDef[], onSave: (categories: CategoryDef[]) => void) {
		super(app);
		this.categories = categories.map(c => ({ ...c }));
		this.onSave = onSave;
	}

	onOpen(): void {
		this.setTitle('Edit categories');
		this.renderContent();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderContent(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.categories.forEach((category, index) => {
			const setting = new Setting(contentEl)
				.setName(`Category ${index + 1}`);

			setting.addText(text => {
				text.setValue(category.name);
				text.onChange(value => {
					this.categories[index] = { ...this.categories[index]!, name: value };
				});
			});

			const colorContainer = setting.controlEl.createDiv({ cls: 'priority-command-color-picker' });
			this.renderColorPicker(colorContainer, category.color || DEFAULT_CATEGORY_COLOR, (color) => {
				this.categories[index] = { ...this.categories[index]!, color };
			});

			setting.addExtraButton(btn => {
				btn.setIcon('trash')
					.onClick(() => {
						this.categories.splice(index, 1);
						this.renderContent();
					});
			});
		});

		new Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('Add category')
					.onClick(() => {
						this.categories.push({ name: '', color: DEFAULT_CATEGORY_COLOR });
						this.renderContent();
					});
			});

		new Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('Save')
					.setCta()
					.onClick(() => {
						const filtered = this.categories.filter(c => c.name.trim() !== '');
						this.onSave(filtered);
						this.close();
					});
			});
	}

	private renderColorPicker(
		container: HTMLElement,
		currentColor: string,
		onChange: (color: string) => void,
	): void {
		for (const preset of CATEGORY_COLOR_PRESETS) {
			const swatch = container.createDiv({ cls: 'priority-command-color-swatch' });
			swatch.style.backgroundColor = preset;
			if (preset === currentColor) {
				swatch.classList.add('priority-command-color-swatch-active');
			}
			swatch.addEventListener('click', () => {
				onChange(preset);
				container.querySelectorAll('.priority-command-color-swatch').forEach(el => {
					el.classList.remove('priority-command-color-swatch-active');
				});
				swatch.classList.add('priority-command-color-swatch-active');
			});
		}
	}
}
