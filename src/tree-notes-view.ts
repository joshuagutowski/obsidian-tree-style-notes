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
	noteElements: Map<string, HTMLDivElement> = new Map<string, HTMLDivElement>;

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

		this.cache.createCache(
			this.app.vault.getFiles(),
			this.app.metadataCache
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
			if (path.has(name)) continue;

			// Determine if this note has no children
			const isBase = Array.from(note.linkSet.keys()).every(key => path.has(key));

			// Create tree item from note
			const treeItem = container.createDiv({
				cls: 'tree-item nav-folder is-collapsed'
			});
			const treeItemSelf = this.createTreeItem(treeItem, name, note, isBase);

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
					treeItem.toggleClass('is-collapsed', isCollapsed);
					collapseIcon?.toggleClass('is-collapsed', isCollapsed);

					if (!isCollapsed) {
						childContainer = treeItem.createDiv({ cls: 'tree-item-children nav-folder-children' });
						const newPath = new Set(path);
						newPath.add(name);
						this.renderItems(childContainer, newPath, name);
					} else if (childContainer) {
						childContainer.remove();
						childContainer = null;
					}
				}
			});
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
		// Higlight note if it's currently active
		if (note.link && note.link == this.plugin.activeFile) {
			treeItemSelf.addClass('is-active');
		}

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
			noteName.style.color = 'var(--nav-item-color-highlighted)';
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


