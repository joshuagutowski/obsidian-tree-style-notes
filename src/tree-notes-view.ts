import {
	ItemView,
	WorkspaceLeaf,
	setIcon
} from "obsidian";

import {
	NoteCache,
	NoteObj,
	SortOrder
} from "./note-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	cache: NoteCache = new NoteCache;
	cutoff: number = 5;
	order: SortOrder = SortOrder.NUM_DESC;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		const container = this.containerEl.children[1];
		container.removeClass('view-content');
		container.addClass('workspace-leaf');
	}

	getViewType(): string {
		return VIEW_TYPE_TREENOTES;
	}

	getDisplayText(): string {
		return "Tree Notes View";
	}

	getIcon(): string {
		return "list-tree"
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		this.cache.createCache(
			this.app.vault.getFiles(),
			this.app.metadataCache
		);
		this.cache.sort(this.order);

		await this.renderView(container);
	}

	async renderView(container: Element) {
		// create header
		this.renderHeader(container);

		// create container
		const navFilesContainer = container.createDiv({
			cls: 'nav-files-container node-insert-event',
		});

		this.renderItems(navFilesContainer, new Set<string>);
	}

	async renderItems(container: HTMLDivElement, path: Set<string>, parentName?: string) {
		const links = !parentName
			? this.cache.links
			: this.cache.links.get(parentName)!.linkSet;

		for (const [name, note] of links) {
			if (!parentName && note.count < this.cutoff) continue;

			if (path.has(name)) continue;

			const treeItem = container.createDiv({
				cls: 'tree-item nav-folder is-collapsed'
			});

			const treeItemSelf = this.createTreeItem(treeItem, name, note);

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
						this.renderItems(childContainer, path.add(name), name);
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

	createTreeItem(treeItem: HTMLDivElement, name: string, note: NoteObj): HTMLDivElement {
		const treeItemSelf = treeItem.createDiv({
			cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
		});

		const collapseIcon = treeItemSelf.createDiv({
			cls: 'tree-item-icon collapse-icon is-collapsed'
		});
		setIcon(collapseIcon, 'right-triangle');

		const noteName = treeItemSelf.createDiv({
			cls: 'tree-item-inner nav-folder-title-content'
		});
		noteName.setText(name);

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

		// new note
		const newNoteButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'New note'
			}
		});
		setIcon(newNoteButton, 'edit')
		newNoteButton.addEventListener('click', async () => {
			this.createNewNote();
		});

		// sort
		const sortButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Change sort order'
			}
		});
		setIcon(sortButton, 'sort-asc')

		// collapse
		const collapseButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Collapse all'
			}
		});
		setIcon(collapseButton, 'chevrons-down-up')
	}

	async createNewNote() {
		const basename = 'Untitled';
		const existingNames = new Set<string>();
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

	async onClose() { }
}

