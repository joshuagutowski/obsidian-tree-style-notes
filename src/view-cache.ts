import { NoteObj } from "./note-cache";
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
	plugin: TreeNotesPlugin;
	view: TreeNotesView;
	container: Element;
	treeItems: ViewObj[];

	constructor(plugin: TreeNotesPlugin, view: TreeNotesView) {
		this.plugin = plugin;
		this.view = view;
		this.treeItems = [];
	}

	clear() {
		this.treeItems = [];
	}

	sort() {
		this.sortRecursive(this.container, this.treeItems);
	}

	sortRecursive(container: Element, children: ViewObj[]) {
		for (const child of children) {
			this.sortRecursive(child.childContainer, child.children);
		}
		container.empty();
		children.sort((a, b) => {
			switch (this.plugin.settings.sortOrder) {
				case "NUM_DESC":
					return a.note.count != b.note.count
						? b.note.count - a.note.count
						: a.name.localeCompare(b.name);
				case "NUM_ASC":
					return a.note.count != b.note.count
						? a.note.count - b.note.count
						: a.name.localeCompare(b.name);
				case "ALPH_ASC":
					return a.name.localeCompare(b.name);
				case "ALPH_DESC":
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
		item.treeItemName.removeClass("potential-note");

		for (const child of item.children) {
			this.handleCreateRecursive(child, noteName);
		}
	}

	handleDelete(noteName: string) {
		for (const item of this.treeItems) {
			if (item.name === noteName) {
				this.handleDeleteRecursive(item, noteName);
			}
		}
	}

	handleDeleteRecursive(item: ViewObj, noteName: string) {
		item.treeItemName.addClass("potential-note");

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
		for (const item of this.treeItems) {
			this.handleModifyRecursive(item, noteName);
		}
		this.sort();
	}

	handleModifyRecursive(item: ViewObj, noteName: string) {
		const currentNum = item.treeItemNumber.getText();
		const newNum = String(item.note.count);

		if (currentNum !== newNum) {
			item.treeItemNumber.setText(newNum);
		}

		if (
			(item.name === noteName ||
				item.children.some((child) => child.name === noteName) ||
				item.note.linkSet.has(noteName)) &&
			!item.isCollapsed
		) {
			item.childContainer.empty();
			item.children = [];
			this.view.renderItems(item);
		}

		for (const child of item.children) {
			this.handleModifyRecursive(child, noteName);
		}
	}
}
