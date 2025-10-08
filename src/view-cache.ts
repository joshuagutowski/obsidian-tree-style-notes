import { NoteObj, SortOrder } from "./note-cache";

import { TreeNotesPlugin } from "./tree-notes-plugin";

import { TreeNotesView } from "./tree-notes-view";

export type ViewObj = {
	name: string;
	note: NoteObj;
	path: string[];
	treeItem: HTMLDivElement;
	treeItemLabel: HTMLDivElement;
	collapseIcon: HTMLDivElement | null;
	treeItemName: HTMLDivElement;
	treeItemNumber: HTMLDivElement;
	isCollapsed: boolean;
	childContainer: HTMLDivElement;
	children: ViewObj[];
};

export class ViewCache {
	treeItems: ViewObj[];
	plugin: TreeNotesPlugin;
	view: TreeNotesView;

	constructor(plugin: TreeNotesPlugin, view: TreeNotesView) {
		this.plugin = plugin;
		this.view = view;
		this.treeItems = [];
	}

	clear() {
		this.treeItems = [];
	}

	sort() {
		this.sortRecursive(this.view.notesContainer, this.treeItems);
	}

	sortRecursive(container: Element, children: ViewObj[]) {
		container.empty();
		for (const child of children) {
			this.sortRecursive(child.childContainer, child.children);
		}
		children.sort((a, b) => {
			switch (this.plugin.settings.sortOrder) {
				case SortOrder.NUM_DESC:
					return a.note.count != b.note.count
						? b.note.count - a.note.count
						: a.name.localeCompare(b.name);
				case SortOrder.NUM_ASC:
					return a.note.count != b.note.count
						? a.note.count - b.note.count
						: a.name.localeCompare(b.name);
				case SortOrder.ALPH_ASC:
					return a.name.localeCompare(b.name);
				case SortOrder.ALPH_DESC:
					return b.name.localeCompare(a.name);
				default:
					return a.note.count != b.note.count
						? b.note.count - a.note.count
						: a.name.localeCompare(b.name);
			}
		});
		container.append(...children.map((obj) => obj.treeItem));
	}

	changeActive(activeNote: string | undefined) {
		for (const item of this.treeItems) {
			this.changeActiveRecursive(item, activeNote);
		}
	}

	changeActiveRecursive(item: ViewObj, activeNote: string | undefined) {
		item.treeItemLabel.removeClass("is-active");

		if (item.name === activeNote) {
			item.treeItemLabel.addClass("is-active");
		}

		for (const child of item.children) {
			this.changeActiveRecursive(child, activeNote);
		}
	}

	handleCreate(noteName: string) {
		for (const item of this.treeItems) {
			this.handleCreateRecursive(item, noteName);
		}
	}

	handleCreateRecursive(item: ViewObj, noteName: string) {
		if (item.name === noteName) {
			item.treeItemName.removeClass("potential-note");
		}

		for (const child of item.children) {
			this.handleCreateRecursive(child, noteName);
		}
	}

	handleDelete(noteName: string) {
		for (const item of this.treeItems) {
			this.handleDeleteRecursive(item, noteName);
		}
	}

	handleDeleteRecursive(item: ViewObj, noteName: string) {
		if (item.name === noteName) {
			item.treeItemName.addClass("potential-note");
		}

		for (const child of item.children) {
			this.handleDeleteRecursive(child, noteName);
		}
	}

	handleRename(oldName: string, newName: string) {
		for (const item of this.treeItems) {
			this.handleRenameRecursive(item, oldName, newName);
		}
	}

	handleRenameRecursive(item: ViewObj, oldName: string, newName: string) {
		if (item.name === oldName) {
			item.treeItemName.setText(newName);
			item.name = newName;
		}

		for (const child of item.children) {
			this.handleRenameRecursive(child, oldName, newName);
		}
	}

	handleModify(noteName: string) {
		let hasChanged = false;

		for (const item of this.treeItems) {
			if (this.handleModifyRecursive(item, noteName)) {
				hasChanged = true;
			}
		}

		if (hasChanged) {
			this.sort();
		}
	}

	handleModifyRecursive(item: ViewObj, noteName: string): boolean {
		let hasChanged = false;

		const currentNum = item.treeItemNumber.getText();
		const newNum = String(item.note.count);

		if (currentNum !== newNum) {
			item.treeItemNumber.setText(newNum);
			hasChanged = true;
		}

		if (!item.isCollapsed) {
			if (
				item.name === noteName ||
				item.children.some((child) => child.name === noteName) ||
				item.note.linkSet.has(noteName)
			) {
				item.childContainer.empty();
				item.children = [];
				this.view.renderItems(item);
				hasChanged = true;
			}
		}

		for (const child of item.children) {
			if (this.handleModifyRecursive(child, noteName)) {
				hasChanged = true;
			}
		}

		return hasChanged;
	}
}

