import { ItemView, WorkspaceLeaf, setIcon, Menu } from "obsidian";

import { TreeNotesPlugin } from "./tree-notes-plugin";

import { NoteObj, NoteCache, SortOrder } from "./note-cache";

import { ViewObj, ViewCache } from "./view-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	plugin: TreeNotesPlugin;
	container: Element;
	viewCache: ViewCache;
	noteCache: NoteCache;

	constructor(leaf: WorkspaceLeaf, plugin: TreeNotesPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.container = this.containerEl.children[1];
		this.container.removeClass("view-content");
		this.container.addClass("workspace-leaf");

		this.noteCache = new NoteCache();
		this.viewCache = new ViewCache();
	}

	getViewType(): string {
		return VIEW_TYPE_TREENOTES;
	}

	getDisplayText(): string {
		return "Tree notes";
	}

	getIcon(): string {
		return "list-tree";
	}

	async onOpen() {
		await this.renderView(true);
	}

	async onClose() {
		this.viewCache.clear();
		this.noteCache.clear();
		this.container.empty();
	}

	async renderView(buildNoteCache: boolean) {
		this.container.empty();

		if (buildNoteCache) {
			this.noteCache.clear();

			const files = this.app.vault.getMarkdownFiles();
			const filteredFiles = files.filter((file) => {
				return file.path.startsWith(this.plugin.settings.rootFolder);
			});

			this.noteCache.createCache(
				filteredFiles,
				this.app.metadataCache,
				this.plugin.settings.includePotential,
			);
		}

		this.noteCache.sort(this.plugin.settings.sortOrder);

		this.renderHeader();

		const notesContainer = this.container.createDiv({
			cls: "nav-files-container node-insert-event",
		});

		this.viewCache.notesContainer = notesContainer;

		this.renderItems([], notesContainer, null);
	}

	renderItems(
		path: string[],
		parentContainer: HTMLDivElement,
		parentName: string | null,
	) {
		// create map to iterate through
		const links = !parentName
			? this.noteCache.notes
			: this.noteCache.notes.get(parentName)?.linkSet;

		if (!links) {
			console.error(
				`renderItems Error: ${parentName} does not exist in note cache`,
			);
			return;
		}

		// make elements from map
		for (const [name, note] of links) {
			// skip if count below cutoff on top level or if note is already in the path
			if (!parentName && note.count < this.plugin.settings.topLevelCutoff)
				continue;
			if (path.includes(name)) continue;

			const notePath: string[] = [...path, name];

			const isBase = Array.from(note.linkSet.keys()).every((key) =>
				path.includes(key),
			);

			const newItem = this.createItem(name, note, notePath, isBase);
			parentContainer.appendChild(newItem.treeItem);
		}

		this.viewCache.changeActive(
			this.app.workspace.getActiveFile()?.basename,
		);
	}

	createItem(
		name: string,
		note: NoteObj,
		path: string[],
		isBase: boolean,
	): ViewObj {
		const treeItem = document.createElement("div");
		treeItem.className = "tree-item nav-folder is-collapsed";

		const treeItemLabel = treeItem.createDiv({
			cls: "tree-item-self nav-folder-title is-clickable mod-collapsible",
		});

		let collapseIcon: HTMLDivElement | null = null;
		if (!isBase) {
			collapseIcon = treeItemLabel.createDiv({
				cls: "tree-item-icon collapse-icon is-collapsed",
			});
			setIcon(collapseIcon, "right-triangle");
		}

		const treeItemName = treeItemLabel.createDiv({
			cls: "tree-item-inner nav-folder-title-content",
		});
		treeItemName.setText(name);
		// highlight note name if it's a potential note
		if (!note.link) {
			treeItemName.addClass("potential-note");
		}

		const treeItemNumber = treeItemLabel.createDiv({
			cls: "tree-item-flair-outer tree-item-flair",
		});
		treeItemNumber.setText(String(note.count));

		const newTreeItem: ViewObj = {
			note: note,
			treeItem: treeItem,
			treeItemLabel: treeItemLabel,
			treeItemName: treeItemName,
			treeItemNumber: treeItemNumber,
			isCollapsed: true,
			childContainer: null,
		};

		this.viewCache.treeItems.set(path, newTreeItem);

		this.setupEventListeners(newTreeItem, name, path, collapseIcon, isBase);

		return newTreeItem;
	}

	private setupEventListeners(
		treeItem: ViewObj,
		name: string,
		path: string[],
		collapseIcon: HTMLDivElement | null,
		isBase: boolean,
	) {
		if (isBase) {
			treeItem.treeItemLabel.addEventListener("click", async () => {
				this.handleNoteOpen(name, treeItem.note);
			});
			return;
		}

		treeItem.treeItemLabel.addEventListener("click", async (event) => {
			if (event.ctrlKey || event.metaKey) {
				this.handleNoteOpen(name, treeItem.note);
				return;
			}

			treeItem.isCollapsed = !treeItem.isCollapsed;

			treeItem.treeItem.toggleClass("is-collapsed", treeItem.isCollapsed);
			collapseIcon?.toggleClass("is-collapsed", treeItem.isCollapsed);

			if (!treeItem.isCollapsed && treeItem.childContainer) {
				treeItem.childContainer.show();
			} else if (!treeItem.isCollapsed) {
				treeItem.childContainer = treeItem.treeItem.createDiv({
					cls: "tree-item-children nav-folder-children",
				});
				this.renderItems(path, treeItem.childContainer, name);
			} else if (treeItem.childContainer) {
				treeItem.childContainer.hide();
			}
		});
	}

	private async handleNoteOpen(name: string, note: NoteObj) {
		if (!note.link) {
			try {
				const newNote = await this.app.vault.create(`${name}.md`, "");
				note.link = newNote;
			} catch (error) {
				console.log(
					`handleNoteOpen Error: couldn't create note ${name}`,
				);
				return;
			}
		}
		this.app.workspace.getLeaf(false).openFile(note.link);
	}

	private async renderHeader() {
		const navHeader = this.container.createDiv({
			cls: "nav-header",
		});
		const navButtons = navHeader.createDiv({
			cls: "nav-buttons-container",
		});

		// New note
		const newNoteButton = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "New note",
			},
		});
		setIcon(newNoteButton, "edit");
		newNoteButton.addEventListener("click", async () => {
			this.createNewUntitledNote();
		});

		// Sort
		const sortButton = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Change sort order",
			},
		});
		setIcon(sortButton, "sort-asc");
		sortButton.addEventListener("click", async (event) => {
			this.changeSortOrder(event);
		});

		// Collapse
		const collapseButton = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Collapse all",
			},
		});
		setIcon(collapseButton, "chevrons-down-up");
		collapseButton.addEventListener("click", async () => {
			this.collapseAll();
		});

		const refreshButton = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Refresh tree",
			},
		});
		setIcon(refreshButton, "refresh-ccw");
		refreshButton.addEventListener("click", async () => {
			this.renderView(true);
		});
	}

	private async createNewUntitledNote() {
		const basename = "Untitled";
		const existingNames = new Set<string>();
		this.app.vault.getFiles().forEach((file) => {
			if (file.basename.startsWith(basename)) {
				existingNames.add(file.basename);
			}
		});

		let newNoteName = basename;
		let counter = 1;
		while (existingNames.has(newNoteName)) {
			newNoteName = `${basename} ${counter}`;
			counter++;
		}

		try {
			const newNote = await this.app.vault.create(
				`${newNoteName}.md`,
				"",
			);
			this.app.workspace.getLeaf(false).openFile(newNote);
		} catch (err) {
			console.error(err);
		}
	}

	private changeSortOrder(event: MouseEvent) {
		const sortMenu = new Menu();
		for (const [order, title] of SortOrder) {
			sortMenu.addItem((item) => {
				item.setTitle(title);
				if (order === this.plugin.settings.sortOrder) {
					item.setChecked(true);
				}
				// Set order in plugin settings and refresh view
				item.onClick(() => {
					this.plugin.settings.sortOrder = order;
					this.plugin.saveSettings();
					this.renderView(false);
				});
			});
		}
		sortMenu.showAtMouseEvent(event);
	}

	private collapseAll() {
		this.renderView(false);
	}
}
