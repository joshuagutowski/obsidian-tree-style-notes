import {
	Plugin,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

import {
	TreeNotesSettings,
	DEFAULT_SETTINGS,
	TreeNotesSettingsTab,
} from "./tree-notes-settings";

import {
	TreeNotesView,
	VIEW_TYPE_TREENOTES,
} from "./tree-notes-view";

export class TreeNotesPlugin extends Plugin {
	settings: TreeNotesSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_TREENOTES,
			(leaf) => new TreeNotesView(leaf, this)
		);

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const activeView = this.app.workspace.getActiveViewOfType(TreeNotesView);
				const newActiveFile = this.app.workspace.getActiveFile();
				if (newActiveFile) {
					activeView?.changeActive(newActiveFile.basename);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('create', (file: TFile) => {
				const activeView = this.app.workspace.getActiveViewOfType(TreeNotesView);
				activeView?.changeCreated(file.basename)
			})
		);
		this.registerEvent(
			this.app.vault.on('delete', (file: TFile) => {
				const activeView = this.app.workspace.getActiveViewOfType(TreeNotesView);
				activeView?.changeDeleted(file.basename)
			})
		);

		this.addRibbonIcon('list-tree', 'Open tree notes view', () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-tree-notes-view",
			name: "Open tree notes view",
			callback: () => {
				this.activateView();
			},
		});

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
