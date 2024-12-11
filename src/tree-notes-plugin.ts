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
				this.refreshView((view) =>
					view.handleChangeActive(
						this.app.workspace.getActiveFile()?.basename
					)
				);
			})
		);

		this.registerEvent(
			this.app.vault.on('create', (file: TFile) =>
				this.refreshView((view) => {
					const cacheFile = view.cache.links.get(file.basename);
					if (cacheFile) {
						cacheFile.link = file;
						view.handleCreate(file.basename);
					}
				})
			)
		);

		this.registerEvent(
			this.app.vault.on('delete', (file: TFile) =>
				this.refreshView((view) => {
					const cacheFile = view.cache.links.get(file.basename);
					if (cacheFile) {
						cacheFile.link = undefined;
						view.handleDelete(file.basename);
					}
				})
			)
		);

		this.registerEvent(
			this.app.vault.on('rename', (file: TFile, oldPath: string) =>
				this.refreshView((view) => {
					const oldBasename = oldPath.substring(
						oldPath.lastIndexOf('/') + 1,
						oldPath.length - 3
					);
					const cacheFile = view.cache.links.get(oldBasename);
					if (cacheFile) {
						view.cache.renameCacheEntry(oldBasename, file.basename)
						view.handleRename(oldBasename, file.basename);
					}
				})
			)
		);

		this.addRibbonIcon('list-tree', 'Open tree notes view', () =>
			this.activateView()
		);

		this.addCommand({
			id: "open-tree-notes-view",
			name: "Open tree notes view",
			callback: () => this.activateView(),
		});

		this.addSettingTab(new TreeNotesSettingsTab(this.app, this));
	}

	async onunload() { }

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

	refreshView(callback: (view: TreeNotesView) => void) {
		for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREENOTES)) {
			let view = leaf.view;
			if (view instanceof TreeNotesView) {
				callback(view);
			}
		}
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
