import {
	ItemView,
	WorkspaceLeaf,
	setIcon,
} from "obsidian";

import {
	createCache,
	FilesCache,
	SortOrder
} from "./file-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	cache: FilesCache;
	cutoff: number;
	order: SortOrder;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.order = SortOrder.NUM_DESC;
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

		// create cache
		this.cache = createCache(
			this.app.vault.getFiles(),
			this.app.metadataCache
		);
		this.cache.sort(this.order);

		await this.renderView(container, 5);
	}

	async renderView(container: Element, cutoff: number) {
		// render view
		container.removeClass('view-content');
		container.addClass('workspace-leaf-content');

		// add nav buttons
		const navHeader = container.createDiv({
			cls: 'nav-header'
		});
		const navButtons = navHeader.createDiv({
			cls: 'nav-buttons-container'
		});
		const newNoteButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'New note'
			}
		});
		setIcon(newNoteButton, 'edit')
		const sortButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Change sort order'
			}
		});
		setIcon(sortButton, 'sort-asc')
		const collapseButton = navButtons.createDiv({
			cls: 'clickable-icon nav-action-button',
			attr: {
				'aria-label': 'Collapse all'
			}
		});
		setIcon(collapseButton, 'chevrons-down-up')


		// create view
		const navFilesContainer = container.createDiv({
			cls: 'nav-files-container node-insert-event',
			attr: {
				style: 'position: relative;'
			}
		});


		this.renderItems(navFilesContainer, "", true);
	}

	async renderItems(container: HTMLDivElement, parentName: string, topLevel: boolean) {
		let links = this.cache.links;
		if (!topLevel) {
			const parent = this.cache.links.get(parentName);
			if (parent) {
				links = parent.linkSet;
			} else {
				return;
			}
			container = container.createDiv({ cls: 'tree-item-children nav-folder-children' });
		}

		for (const [name, file] of links) {
			if (topLevel && file.count < this.cutoff) {
				continue
			}

			const treeItem = container.createDiv({ cls: 'tree-item nav-folder is-collapsed' });

			// title container
			const treeItemSelf = treeItem.createDiv({
				cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
			});

			const collapseIcon = treeItemSelf.createDiv({
				cls: 'tree-item-icon collapse-icon is-collapsed'
			});
			setIcon(collapseIcon, 'right-triangle');

			const fileName = treeItemSelf.createDiv({
				cls: 'tree-item-inner nav-folder-title-content'
			});
			fileName.setText(name);

			const linkCount = treeItemSelf.createDiv({
				cls: 'tree-item-flair-outer tree-item-flair'
			});
			linkCount.setText(String(file.count));

			let collapsed = true;

			treeItemSelf.addEventListener('click', async (event) => {
				if (event.ctrlKey || event.metaKey) {
					if (file.link === undefined) {
						const newFile = await this.app.vault.create(
							`${name}.md`,
							''
						);
						file.link = newFile;
					}
					this.app.workspace.getLeaf(false).openFile(file.link);
				} else {
					if (collapsed) {
						container.toggleClass('is-collapsed', false);
						collapseIcon.toggleClass('is-collapsed', false);
						collapsed = false;
						this.renderItems(treeItem, name, false);
					} else {
						container.toggleClass('is-collapsed', true);
						collapseIcon.toggleClass('is-collapsed', true);
						collapsed = true;
					}
				}
			});
		}
	}

	async onClose() { }
}

