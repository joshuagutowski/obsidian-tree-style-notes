import { ItemView, WorkspaceLeaf, setIcon, Menu } from "obsidian";

import { TreeNotesPlugin } from "./tree-notes-plugin";

import { NoteObj, NoteCache, SortOrder } from "./note-cache";

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

export class TreeNotesView extends ItemView {
	plugin: TreeNotesPlugin;
	container: Element;
	noteCache: NoteCache = new NoteCache();
	viewCache: Map<string[], HTMLDivElement> = new Map();

	constructor(leaf: WorkspaceLeaf, plugin: TreeNotesPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.container = this.containerEl.children[1];
		this.container.removeClass("view-content");
		this.container.addClass("workspace-leaf");
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
		await this.renderView();
	}

	async onClose() {
		this.container.empty();
		this.viewCache.clear();
		this.noteCache.clearCache();
	}

	async renderView() {
		this.container.empty();
		this.viewCache.clear();
		this.noteCache.clearCache();

		const files = this.app.vault.getMarkdownFiles();
		const filteredFiles = files.filter((file) => {
			return file.path.startsWith(this.plugin.settings.rootFolder);
		});

		this.noteCache.createCache(
			filteredFiles,
			this.app.metadataCache,
			this.plugin.settings.includePotential,
		);
		this.noteCache.sort(this.plugin.settings.sortOrder);

		this.renderHeader(this.container);

		const navFilesContainer = this.container.createDiv({
			cls: "nav-files-container node-insert-event",
		});

		this.renderItems(navFilesContainer, [], null);
	}

	async renderItems(
		container: HTMLDivElement,
		path: string[],
		parentName: string | null,
	) {
		// Create array to iterate through
		const links = !parentName
			? this.noteCache.links
			: this.noteCache.links.get(parentName)?.linkSet;

		if (!links) {
			console.error(
				`renderItems Error: ${parentName} does not exist in note cache`,
			);
			return;
		}

		for (const [name, note] of links) {
			// Skip if count below cutoff on top level or if note is already in the path
			if (!parentName && note.count < this.plugin.settings.topLevelCutoff)
				continue;
			if (path.includes(name)) continue;

			const currentPath: string[] = [...path, name];

			const isBase = Array.from(note.linkSet.keys()).every((key) =>
				path.includes(key),
			);

			let treeItem =
				this.viewCache.get(currentPath) ??
				container.createDiv({
					cls: "tree-item nav-folder is-collapsed",
				});
			this.viewCache.set(currentPath, treeItem);

			const treeItemLabel = this.createTreeItemLabel(
				treeItem,
				name,
				note,
				isBase,
			);

			// If note has no children, add a listner to open the note skip the rest
			if (isBase) {
				treeItemLabel.addEventListener("click", async () => {
					this.handleNoteOpen(name, note);
				});
				continue;
			}

			// Click event handling
			let isCollapsed = true;
			let childContainer: HTMLDivElement | null = null;

			treeItemLabel.addEventListener("click", async (event) => {
				if (event.ctrlKey || event.metaKey) {
					this.handleNoteOpen(name, note);
					return;
				}

				isCollapsed = !isCollapsed;

				treeItem.toggleClass("is-collapsed", isCollapsed);
				treeItemLabel
					.querySelector(".collapse-icon")
					?.toggleClass("is-collapsed", isCollapsed);

				if (!isCollapsed && childContainer) {
					childContainer.show();
				} else if (!isCollapsed) {
					childContainer = treeItem.createDiv({
						cls: "tree-item-children nav-folder-children",
					});
					this.renderItems(childContainer, currentPath, name);
				} else if (childContainer) {
					childContainer.hide();
				}
			});
		}

		this.handleChangeActive(this.app.workspace.getActiveFile()?.basename);
	}

	createTreeItemLabel(
		treeItem: HTMLDivElement,
		name: string,
		note: NoteObj,
		isBase: boolean,
	): HTMLDivElement {
		const treeItemSelf = treeItem.createDiv({
			cls: "tree-item-self nav-folder-title is-clickable mod-collapsible",
		});

		if (!isBase) {
			const collapseIcon = treeItemSelf.createDiv({
				cls: "tree-item-icon collapse-icon is-collapsed",
			});
			setIcon(collapseIcon, "right-triangle");
		}

		const noteName = treeItemSelf.createDiv({
			cls: "tree-item-inner nav-folder-title-content",
		});
		noteName.setText(name);
		// Highlight note name if it's a potential note
		if (!note.link) {
			noteName.addClass("potential-note");
		}

		const linkCount = treeItemSelf.createDiv({
			cls: "tree-item-flair-outer tree-item-flair",
		});
		linkCount.setText(String(note.count));

		return treeItemSelf;
	}

	async handleNoteOpen(name: string, note: NoteObj) {
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

	handleChangeActive(noteName: string | undefined) {
		for (const [path, div] of this.viewCache) {
			const treeItemLabel = div.querySelector(".tree-item-self");
			if (!treeItemLabel) {
				console.error(
					`handleChangeActive Error: div .tree-item-self does not exist for ${noteName}`,
				);
				continue;
			}

			treeItemLabel.removeClass("is-active");

			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				treeItemLabel.addClass("is-active");
			}
		}
	}

	handleCreate(noteName: string) {
		for (const [path, div] of this.viewCache) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				const treeItemName = div.querySelector(".tree-item-inner");
				if (!treeItemName) {
					console.error(
						`handleCreate Error: div .tree-item-inner does not exist for ${noteName}`,
					);
					continue;
				}
				treeItemName.removeClass("potential-note");
			}
		}
	}

	handleDelete(noteName: string) {
		for (const [path, div] of this.viewCache) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				const treeItemName = div.querySelector(".tree-item-inner");
				if (!treeItemName) {
					console.error(
						`handleDelete Error: div .tree-item-inner does not exist for ${noteName}`,
					);
					continue;
				}
				treeItemName.addClass("potential-note");
			}
		}
	}

	handleRename(oldName: string, newName: string) {
		for (const [path, div] of this.viewCache) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === oldName) {
				const treeItemName = div.querySelector(".tree-item-inner");
				if (!treeItemName) {
					console.error(
						`handleRename Error: div .tree-item-inner does not exist for ${oldName}`,
					);
					continue;
				}
				treeItemName.setText(newName);
			}

			// replace the name in any path which contains it
			const nameIndex = path.indexOf(oldName);
			if (nameIndex != -1) {
				path[nameIndex] = newName;
			}
		}
	}

	// --- Create a proper div cache to handle updating and sorting more gracefully ---
	// isCollapsed and childContainer as part of cache element to make accesible
	// can use path as name, but children should be in parent object, rather than all together in the same map
	handleModify(noteName: string) {
		for (const [path, div] of this.viewCache) {
			const nameInPath = path[path.length - 1];

			// update link count for each element in viewCache
			const treeItemNumber = div.querySelector(".tree-item-flair-outer");
			const note = this.noteCache.links.get(nameInPath);
			if (!treeItemNumber || !note) {
				console.error(
					`handleModify Error: couldn't update count for ${nameInPath}`,
				);
				continue;
			}
			treeItemNumber.setText(String(note.count));

			if (nameInPath === noteName || note.linkSet.has(noteName)) {
				// --- TODO ---
				// rerender this div, and delete all it's children from viewCache
			}
		}
	}

	async renderHeader(container: Element) {
		const navHeader = container.createDiv({
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
			this.renderView();
		});
	}

	async createNewUntitledNote() {
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

	changeSortOrder(event: MouseEvent) {
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
					this.renderView();
				});
			});
		}
		sortMenu.showAtMouseEvent(event);
	}

	collapseAll() {
		this.container.empty();
		this.viewCache.clear();

		this.renderHeader(this.container);

		const navFilesContainer = this.container.createDiv({
			cls: "nav-files-container node-insert-event",
		});

		this.renderItems(navFilesContainer, [], null);

		this.handleChangeActive(this.app.workspace.getActiveFile()?.basename);
	}
}
