import { ItemView, WorkspaceLeaf, setIcon, Menu } from "obsidian";

import { TreeNotesPlugin } from "./tree-notes-plugin";

import { NoteObj, NoteCache, SortOrder } from "./note-cache";

import { ViewObj, ViewCache } from "./view-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	plugin: TreeNotesPlugin;
	container: Element;
	notesContainer: Element;
	viewCache: ViewCache;
	noteCache: NoteCache;

	constructor(leaf: WorkspaceLeaf, plugin: TreeNotesPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.container = this.containerEl.children[1];
		this.container.removeClass("view-content");
		this.container.addClass("workspace-leaf");

		this.noteCache = new NoteCache(plugin);
		this.viewCache = new ViewCache(plugin, this);
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
		this.notesContainer.empty();
		this.container.empty();
	}

	async renderView(buildNoteCache: boolean) {
		this.container.empty();
		this.viewCache.clear();

		if (buildNoteCache) {
			this.noteCache.clear();

			const files = this.app.vault.getMarkdownFiles();

			this.noteCache.createCache(files, this.app.metadataCache);
		}

		this.noteCache.sort(this.plugin.settings.sortOrder);

		this.renderHeader();

		this.notesContainer = this.container.createDiv({
			cls: "nav-files-container node-insert-event",
		});

		this.renderItems(null);
	}

	renderItems(parent: ViewObj | null) {
		// parent is null if top level
		// create map to iterate through
		const links = parent ? parent.note.linkSet : this.noteCache.notes; // top level

		const parentContainer = parent
			? parent.childContainer
			: this.notesContainer; // top level

		const parentArray = parent ? parent.children : this.viewCache.treeItems; // top level

		const path = parent ? parent.path : [];

		// make elements from map
		for (const [name, note] of links) {
			// skip if count below cutoff on top level or if note is already in the path
			if (!parent && note.count < this.plugin.settings.topLevelCutoff)
				continue;
			if (path.includes(name)) continue;

			const notePath: string[] = [...path, name];

			const newItem = this.createItem(name, note, notePath);

			parentArray.push(newItem);
		}

		parentContainer.append(...parentArray.map((item) => item.treeItem));

		this.viewCache.changeActive(
			this.app.workspace.getActiveFile()?.basename,
		);
	}

	createItem(name: string, note: NoteObj, path: string[]): ViewObj {
		const isBase = Array.from(note.linkSet.keys()).every((key) =>
			path.includes(key),
		);

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

		const childContainer = treeItem.createDiv({
			cls: "tree-item-children nav-folder-children",
		});
		childContainer.hide();

		const newTreeItem: ViewObj = {
			name: name,
			note: note,
			path: path,
			treeItem: treeItem,
			treeItemLabel: treeItemLabel,
			collapseIcon: collapseIcon,
			treeItemName: treeItemName,
			treeItemNumber: treeItemNumber,
			isCollapsed: true,
			childContainer: childContainer,
			children: [],
		};

		this.setupEventListeners(newTreeItem, isBase);

		return newTreeItem;
	}

	private setupEventListeners(item: ViewObj, isBase: boolean) {
		if (isBase) {
			item.treeItemLabel.addEventListener("click", async () => {
				this.handleNoteOpen(item.name, item.note);
			});
			return;
		}

		item.treeItemLabel.addEventListener("click", async (event) => {
			if (event.ctrlKey || event.metaKey) {
				this.handleNoteOpen(item.name, item.note);
				return;
			}

			item.isCollapsed = !item.isCollapsed;

			item.treeItem.toggleClass("is-collapsed", item.isCollapsed);
			item.collapseIcon?.toggleClass("is-collapsed", item.isCollapsed);

			if (!item.isCollapsed) {
				if (!item.childContainer.hasChildNodes()) {
					this.renderItems(item);
				}
				item.childContainer.show();
			} else {
				item.childContainer.hide();
			}
		});
	}

	private async handleNoteOpen(name: string, note: NoteObj) {
		if (!note.link) {
			try {
				const newNote = await this.app.vault.create(`${name}.md`, "");
				note.link = newNote;
			} catch (err) {
				console.error(`handleNoteOpen Error: ${err}`);
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
			console.error(`createNewUntitledNote Error: ${err}`);
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
