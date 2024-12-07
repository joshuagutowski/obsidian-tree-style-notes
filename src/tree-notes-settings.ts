import {
	App,
	normalizePath,
	PluginSettingTab,
	Setting,
} from "obsidian";

import {
	TreeNotesPlugin,
} from "./tree-notes-plugin";

import {
	VIEW_TYPE_TREENOTES,
	TreeNotesView,
} from "./tree-notes-view";

export interface TreeNotesSettings {
	rootFolder: string;
	topLevelCutoff: number;
	includePotential: boolean;
	sortOrder: string;
}

export const DEFAULT_SETTINGS: TreeNotesSettings = {
	rootFolder: "",
	topLevelCutoff: 4,
	includePotential: true,
	sortOrder: "NUM_DESC",
};

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
			.setName("Notes folder")
			.setDesc(
				"Set which folder to search in, defaults to main directory",
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: folder 1/folder 2")
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						let normalised = normalizePath(value);
						if (value === "") {
							normalised = "";
						}
						this.plugin.settings.rootFolder = normalised;
						await this.plugin.saveSettings();
						for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
							let view = leaf.view;
							if (view instanceof TreeNotesView) {
								view.renderView();
							}
						}
					}),
			);

		new Setting(containerEl)
			.setName("Link count cutoff")
			.setDesc(
				"Set how many links are required for a note to show up in the top level of the tree, defaults to 4",
			)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = "0";
				text
					.setValue(this.plugin.settings.topLevelCutoff.toString())
					.onChange(async (value) => {
						const parsedValue = parseInt(value, 10);
						if (isNaN(parsedValue)) {
							this.plugin.settings.topLevelCutoff = 4;
						} else {
							this.plugin.settings.topLevelCutoff = parsedValue;
						}
						await this.plugin.saveSettings();
						for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
							let view = leaf.view;
							if (view instanceof TreeNotesView) {
								view.renderView();
							}
						}
					});
			});

		new Setting(containerEl)
			.setName("Include uncreated notes")
			.setDesc(
				"Set whether notes which don't exist yet, but are linked in notes which do, should be included",
			)
			.addToggle((ToggleComponent) =>
				ToggleComponent.setValue(
					this.plugin.settings.includePotential,
				).onChange(async (value) => {
					this.plugin.settings.includePotential = value;
					await this.plugin.saveSettings();
					for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
						let view = leaf.view;
						if (view instanceof TreeNotesView) {
							view.renderView();
						}
					}
				}),
			);
	}
}
