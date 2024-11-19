import {
	ItemView,
	WorkspaceLeaf,
} from "obsidian";

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

		// create sections
		const existingFiles = container.createEl('div', { cls: 'nav-folder' });
		// add headings
		existingFiles.createEl('div', { text: 'Existing Files', cls: 'nav-folder-title' });

		// Track potential links
		//const potentialLinks = new Set<string>();

		for (const file of files) {
			// get file cache
			//const fileCache = metadataCache.getFileCache(file);


			// Add existing file to the view
			const fileItem = existingFiles.createDiv({ cls: 'nav-file' });
			const fileLink = fileItem.createDiv({ cls: 'nav-file-title' });
			fileLink.setText(file.basename);

			// Add click handler to open file
			fileLink.onClickEvent(() => {
				this.app.workspace.getLeaf(false).openFile(file);
			});
		}

	}

	async onClose() { }
}

