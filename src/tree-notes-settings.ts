import {
	App,
	PluginSettingTab,
	Setting,
} from "obsidian";

import {
	TreeNotesPlugin
} from "./tree-notes-plugin";

export interface TreeNotesSettings {
	searchFolder: string;
	topLevelCutoff: number;
	includeUncreated: boolean;
	sortOrder: string;
}

export const DEFAULT_SETTINGS: TreeNotesSettings = {
	searchFolder: ".",
	topLevelCutoff: 4,
	includeUncreated: true,
	sortOrder: "NUM_DESC",
};

//settings
export class TreeNotesSettingsTab extends PluginSettingTab {
	plugin: TreeNotesPlugin;

	constructor(app: App, plugin: TreeNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Notes Folder")
			.setDesc(
				"Set which folder to search in, defaults to main directory",
			)
			.addText((text) =>
				text
					.setPlaceholder("Folder Name")
					.setValue(this.plugin.settings.searchFolder)
					.onChange(async (value) => {
						this.plugin.settings.searchFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Link Count Cutoff")
			.setDesc(
				"Set how many links are required for a note to show up in the top level view, defaults to 4",
			)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = "0";
				text
					.setPlaceholder("Link Count")
					.setValue(this.plugin.settings.topLevelCutoff.toString())
					.onChange(async (value) => {
						const parsedValue = parseInt(value, 10);
						if (isNaN(parsedValue)) {
							return;
						}
						this.plugin.settings.topLevelCutoff = parsedValue;
						await this.plugin.saveSettings();
						this.plugin.view?.renderView();
					});
			});

		new Setting(containerEl)
			.setName("Include Uncreated Notes")
			.setDesc(
				"Set whether notes which are not yet created should be included",
			)
			.addToggle((ToggleComponent) =>
				ToggleComponent.setValue(
					this.plugin.settings.includeUncreated,
				).onChange(async (value) => {
					this.plugin.settings.includeUncreated = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
