import {
	ItemView,
	WorkspaceLeaf,
	setIcon,
} from "obsidian";

import { createCache } from "./file-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
		await this.renderView(container);
	}

	async renderView(container: Element) {
		// get vault files and metadata
		const files = this.app.vault.getFiles();
		const metadataCache = this.app.metadataCache;

		// create cache
		const cache = createCache(files, metadataCache)

		// sort cache
		cache.links = new Map([...cache.links.entries()].sort((a, b) => b[1] - a[1]));


		container.removeClass('view-content');
		container.addClass('workspace-leaf-content')

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

		// create view
		const linkFiles = container.createDiv({
			cls: 'nav-files-container node-insert-event',
			attr: {
				style: 'position: relative;'
			}
		});


		// add files to view
		for (const link of cache.links) {
			if (link[1] < 5) {
				continue
			}
			// main file container
			const treeItem = linkFiles.createDiv({ cls: 'tree-item nav-folder is-collapsed' });

			// title container
			const treeItemSelf = treeItem.createDiv({
				cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
			});

			// collapse icon
			const collapseIcon = treeItemSelf.createDiv({
				cls: 'tree-item-icon collapse-icon is-collapsed'
			});
			setIcon(collapseIcon, 'right-triangle');


			// file name
			const fileName = treeItemSelf.createDiv({
				cls: 'tree-item-inner nav-folder-title-content'
			});
			fileName.setText(link[0]);

			// file count
			const linkCount = treeItemSelf.createDiv({
				cls: 'tree-item-flair-outer tree-item-flair'
			});
			linkCount.setText(String(link[1]));

			let collapsed = true

			treeItemSelf.addEventListener('click', (event) => {
				if (collapsed) {
					treeItem.toggleClass('is-collapsed', false);
					collapseIcon.toggleClass('is-collapsed', false);
					collapsed = false
				} else {
					treeItem.toggleClass('is-collapsed', true);
					collapseIcon.toggleClass('is-collapsed', true);
					collapsed = true
				}
			});
		}
	}

	async onClose() { }
}

