import {
	App,
	Editor,
	ItemView,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

// settings types
interface TreeNotesSettings {
	searchFolder: string;
	topLevelCutoff: string;
	includeUncreated: boolean;
}

const DEFAULT_SETTINGS: TreeNotesSettings = {
	searchFolder: ".",
	topLevelCutoff: "3",
	includeUncreated: true,
};

// view types
const VIEW_TYPE_TREENOTES = "tree-notes-view";

class TreeNotesView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_TREENOTES;
	}

	getDisplayText(): string {
		return "Tree Notes View";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Tree Style Notes" });
	}

	async onClose() { }
}

// main plugin
export default class TreeStyleNotesPlugin extends Plugin {
	settings: TreeNotesSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_TREENOTES,
			(leaf) => new TreeNotesView(leaf)
		);

		this.addRibbonIcon('list-tree', 'Tree Style Notes View', () => {
			this.activateView();
		});



		// simple command
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});



		// settings tab
		this.addSettingTab(new TreeNotesSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
		);
	}

	onunload() { }

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TREENOTES);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

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
				"Set how many links are required for a note to show up in the top level, defaults to 3",
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
