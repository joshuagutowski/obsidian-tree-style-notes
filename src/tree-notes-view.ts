import {
	ItemView,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

type FileObj = {
	name: string;
	existingLinks: Set<string>;
	potentialLinks: Set<string>;
	linkCount: number;
}

interface existingFileObj extends FileObj {
	path: string;
}

interface potentialFileObj extends FileObj {
	path: string;
}

type FilesCache = {
	links: Map<string, number>;
	//existingLinks: Map<string, existingFileObj>;
	//potentialLinks: Map<string, potentialFileObj>;
}

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
		let links = new Map<string, number>()

		for (const file of files) {
			if (!links.has(file.basename)) {
				links.set(file.basename, 0)
			}

			const fileCache = metadataCache.getFileCache(file);

			// go through links in body
			if (fileCache && fileCache.links) {
				for (const link of fileCache.links) {
					if (!links.has(link.link)) {
						links.set(link.link, 0)
					}
					links.set(link.link, links.get(link.link) + 1)
				}
			}

			// go through links in metadata
			if (fileCache && fileCache.frontmatterLinks) {
				for (const link of fileCache.frontmatterLinks) {
					if (!links.has(link.link)) {
						links.set(link.link, 0)
					}
					links.set(link.link, links.get(link.link) + 1)
				}
			}
		}

		const sortedLinks = new Map([...links.entries()].sort((a, b) => b[1] - a[1]));

		const linkFiles = container.createDiv({
			cls: 'nav-files-container',
			attr: {
				style: 'position: relative;'
			}
		});
		const navButtons = linkFiles.createDiv({
			cls: 'nav-buttons-container'
		});

		// add files to view
		for (const link of sortedLinks) {
			if (link[1] < 5) {
				continue
			}
			// main container
			const treeItem = linkFiles.createDiv({ cls: 'tree-item nav-folder is-collapsed' });

			// title container
			const treeItemSelf = treeItem.createDiv({
				cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
			});

			// collapse icon
			const collapseIcon = treeItemSelf.createDiv({
				cls: 'tree-item-icon collapse-icon is-collapsed'
			});

			collapseIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle">
				<path d="M3 8L12 17L21 8"></path>
			</svg>
			`;

			// content
			const fileName = treeItemSelf.createDiv({
				cls: 'tree-item-inner nav-folder-title-content'
			});
			fileName.setText(link[0]);

			const linkCount = treeItemSelf.createDiv({
				cls: 'tree-item-flair-outer tree-item-flair'
			});
			linkCount.setText("" + link[1]);


			treeItemSelf.addEventListener('click', (event) => {
				treeItem.toggleClass('is-collapsed', false);
				collapseIcon.toggleClass('is-collapsed', false);
			});
		}



		//// create section
		//const existingFiles = container.createEl('div', { cls: 'nav-folder' });
		//// add headings
		//existingFiles.createEl('div', { text: 'Existing Files', cls: 'nav-folder-title' });

		//// add files to view
		//for (const file of files) {
		//	// Add existing file to the view
		//	const fileItem = existingFiles.createDiv({ cls: 'nav-file' });
		//	const fileLink = fileItem.createDiv({ cls: 'nav-file-title' });
		//	fileLink.setText(file.basename);

		//	// Add click handler to open file
		//	fileLink.onClickEvent(() => {
		//		this.app.workspace.getLeaf(false).openFile(file);
		//	});
		//}

	}

	async onClose() { }
}

