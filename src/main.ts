import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

import {
	TreeNotesSettings,
	DEFAULT_SETTINGS,
	VIEW_TYPE_TREENOTES,
} from "./types";

import {
	TreeNotesView,
} from "./tree-notes-view";

// main plugin
export default class TreeStyleNotesPlugin extends Plugin {
	settings: TreeNotesSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_TREENOTES,
			(leaf) => new TreeNotesView(leaf, this.settings.sortOrder, 8)
		);

		// open view ribbon
		this.addRibbonIcon('list-tree', 'Tree Style Notes View', () => {
			this.activateView();
		});

		// open view command
		this.addCommand({
			id: "open-tree-style-notes-view",
			name: "Open Tree Style Notes View",
			callback: () => {
				this.activateView();
			},
		});

		// settings tab
		this.addSettingTab(new TreeNotesSettingsTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TREENOTES)
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TREENOTES);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				return
			}
			await leaf.setViewState({ type: VIEW_TYPE_TREENOTES, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//settings
class TreeNotesSettingsTab extends PluginSettingTab {
	plugin: TreeStyleNotesPlugin;

	constructor(app: App, plugin: TreeStyleNotesPlugin) {
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
				"Set how many links are required for a note to show up in the top level, defaults to 8",
			)
			.addText((text) =>
				text
					.setPlaceholder("Link Count")
					.setValue(this.plugin.settings.topLevelCutoff)
					.onChange(async (value) => {
						this.plugin.settings.topLevelCutoff = value;
						await this.plugin.saveSettings();
					}),
			);

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
