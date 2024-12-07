import {
	ItemView,
	WorkspaceLeaf,
	setIcon,
	Menu,
} from "obsidian";

import {
	TreeNotesPlugin,
} from "./tree-notes-plugin";

import {
	NoteObj,
	NoteCache,
	SortOrder,
} from "./note-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	plugin: TreeNotesPlugin;
	cache: NoteCache = new NoteCache;
	container: Element;
	divCache: Map<Set<string>, HTMLDivElement> = new Map();

	constructor(leaf: WorkspaceLeaf, plugin: TreeNotesPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.container = this.containerEl.children[1];
		this.container.removeClass('view-content');
		this.container.addClass('workspace-leaf');
	}

	getViewType(): string {
		return VIEW_TYPE_TREENOTES;
	}

	getDisplayText(): string {
		return "Tree notes view";
	}

	getIcon(): string {
		return "list-tree"
	}

	async onOpen() {
		await this.renderView();
	}

	async onClose() {
		this.container.empty();
		this.cache.clearCache();
	}

	async renderView() {
		this.container.empty();
		this.cache.clearCache();

		const files = this.app.vault.getMarkdownFiles();
		const filteredFiles = files.filter(file => {
			return file.path.startsWith(this.plugin.settings.rootFolder)
		});

		this.cache.createCache(
			filteredFiles,
			this.app.metadataCache,
			this.plugin.settings.includePotential
		);
		this.cache.sort(this.plugin.settings.sortOrder);

		this.renderHeader(this.container);

		const navFilesContainer = this.container.createDiv({
			cls: 'nav-files-container node-insert-event',
		});

		this.renderItems(navFilesContainer, new Set<string>);
	}

	async renderItems(container: HTMLDivElement, path: Set<string>, parentName?: string) {
		// Create array to iterate through
		const links = !parentName
			? this.cache.links
			: this.cache.links.get(parentName)!.linkSet;

		for (const [name, note] of links) {
			// Skip if count below cutoff on top level or if note is already in the path
			if (!parentName && note.count < this.plugin.settings.topLevelCutoff) continue;

			// If file is a parent skip, otherwise create a new path with this note
			if (path.has(name)) continue;
			const pathWithCurrent = new Set(path);
			pathWithCurrent.add(name);

			// Determine if this note has no children
			const isBase = Array.from(note.linkSet.keys()).every(key => path.has(key));

			// Read item from cache, or create it and cache it
			let treeItem = this.divCache.get(pathWithCurrent);
			if (!treeItem) {
				treeItem = container.createDiv({
					cls: 'tree-item nav-folder is-collapsed'
				});
				this.divCache.set(pathWithCurrent, treeItem);
			}

			const treeItemSelf = this.createTreeItem(treeItem, name, note, isBase);

			// Higlight note if it's currently active
			if (note.link && note.link == this.plugin.activeFile) {
				treeItemSelf.addClass('is-active');
			}

			// If note has no children, add a listner to open the note skip the rest
			if (isBase) {
				treeItemSelf.addEventListener('click', async () => {
					this.handleNoteOpen(name, note);
				});
				continue;
			}

			// Click event handling
			let isCollapsed = true;
			let childContainer: HTMLDivElement | null = null;

			const collapseIcon = treeItemSelf.querySelector('.collapse-icon');

			treeItemSelf.addEventListener('click', async (event) => {
				if (event.ctrlKey || event.metaKey) {
					this.handleNoteOpen(name, note);
				} else {
					isCollapsed = !isCollapsed;
					treeItem!.toggleClass('is-collapsed', isCollapsed);
					collapseIcon?.toggleClass('is-collapsed', isCollapsed);

					if (!isCollapsed) {
						childContainer = treeItem!.createDiv({
							cls: 'tree-item-children nav-folder-children'
						});
						this.renderItems(childContainer, pathWithCurrent, name);
					} else if (childContainer) {
						childContainer.remove();
						childContainer = null;
						this.divCache.delete(path);
					}
				}
			});
		}
	}

	async changeActive(oldNote: string | undefined, newNote: string | undefined) {
		for (const [path, div] of this.divCache) {
			const nameVal = Array.from(path)[path.size - 1];
			if (nameVal === oldNote) {
				const treeItemSelf = div.querySelector('.tree-item-self')
				treeItemSelf?.removeClass('is-active');
			}
			if (nameVal === newNote) {
				const treeItemSelf = div.querySelector('.tree-item-self')
				treeItemSelf?.addClass('is-active');
			}
		}
	}

	async changeCreated(note: string) {
		for (const [path, div] of this.divCache) {
			const nameVal = Array.from(path)[path.size - 1];
			if (nameVal === note) {
				const nameDiv = div.querySelector('.tree-item-inner');
				nameDiv?.removeClass('potential-note')
			}
		}
	}

	async changeDeleted(note: string) {
		for (const [path, div] of this.divCache) {
			const nameVal = Array.from(path)[path.size - 1];
			if (nameVal === note) {
				const nameDiv = div.querySelector('.tree-item-inner');
				nameDiv?.addClass('potential-note')
			}
		}
	}

	async handleNoteOpen(name: string, note: NoteObj) {
		if (!note.link) {
			const newNote = await this.app.vault.create(
				`${name}.md`,
				''
			);
			note.link = newNote;
		}
		this.app.workspace.getLeaf(false).openFile(note.link);
	}

	createTreeItem(treeItem: HTMLDivElement, name: string, note: NoteObj, isBase: boolean): HTMLDivElement {
		const treeItemSelf = treeItem.createDiv({
			cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
		});

		if (!isBase) {
			const collapseIcon = treeItemSelf.createDiv({
				cls: 'tree-item-icon collapse-icon is-collapsed'
			});
			setIcon(collapseIcon, 'right-triangle');
		}

		const noteName = treeItemSelf.createDiv({
			cls: 'tree-item-inner nav-folder-title-content'
		});
		noteName.setText(name);
		// Highlight note name if it's a potential note
		if (!note.link) {
			noteName.addClass('potential-note');
		}

		const linkCount = treeItemSelf.createDiv({
			cls: 'tree-item-flair-outer tree-item-flair'
		});
		linkCount.setText(String(note.count));

		return treeItemSelf;
	}

	async renderHeader(container: Element) {
		const navHeader = container.createDiv({
			cls: 'nav-header'
		});
		const navButtons = navHeader.createDiv({
			cls: 'nav-buttons-container'
		});

		// New note
		const newNoteButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'New note'
			}
		});
		setIcon(newNoteButton, 'edit')
		newNoteButton.addEventListener('click', async () => {
			this.createNewUntitledNote();
		});

		// Sort
		const sortButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Change sort order'
			}
		});
		setIcon(sortButton, 'sort-asc')
		sortButton.addEventListener('click', async (event) => {
			this.changeSortOrder(event);
		});

		// Collapse
		const collapseButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Collapse all'
			}
		});
		setIcon(collapseButton, 'chevrons-down-up')
		collapseButton.addEventListener('click', async () => {
			this.renderView();
		});

		const refreshButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Refresh tree'
			}
		});
		setIcon(refreshButton, 'refresh-ccw')
		refreshButton.addEventListener('click', async () => {
			this.renderView();
		});
	}

	async createNewUntitledNote() {
		const basename = 'Untitled';
		const existingNames = new Set<string>;
		this.app.vault.getFiles().forEach(file => {
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

		const newNote = await this.app.vault.create(
			`${newNoteName}.md`,
			''
		);
		this.app.workspace.getLeaf(false).openFile(newNote);
	}

	changeSortOrder(event: MouseEvent) {
		const sortMenu = new Menu;
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
					this.renderView();
				});
			});
		}
		sortMenu.showAtMouseEvent(event);
	}
}


