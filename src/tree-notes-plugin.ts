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
				const activeFile = this.app.workspace.getActiveFile();
				for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
					let view = leaf.view;
					if (view instanceof TreeNotesView) {
						if (activeFile) {
							view.changeActive(activeFile.basename);
						}
					}
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('create', (file: TFile) => {
				for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
					let view = leaf.view;
					if (view instanceof TreeNotesView) {
						view.changeCreated(file.basename);
					}
				}
			})
		);
		this.registerEvent(
			this.app.vault.on('delete', (file: TFile) => {
				for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
					let view = leaf.view;
					if (view instanceof TreeNotesView) {
						view.changeDeleted(file.basename);
					}
				}
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
