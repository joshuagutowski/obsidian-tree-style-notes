import { NoteObj } from "./note-cache";

export type ViewObj = {
	name: string;
	note: NoteObj;
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

	constructor() {
		this.treeItems = [];
	}

	clear() {
		this.treeItems = [];
	}

	sort() {
		// sorts the whole container
	}

	render() {
		// renders all the tree items
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
	}

	handleModifyRecursive(item: ViewObj, noteName: string) {
		const currentNum= item.treeItemNumber.getText();
		const newNum = String(item.note.count);

		if (currentNum !== newNum) {
			item.treeItemNumber.setText(newNum);
		}

		if (item.name === noteName || item.children.some((child) => child.name === noteName) || item.note.linkSet.has(noteName)) {
			item.isCollapsed = true;
			item.treeItem.toggleClass("is-collapsed", item.isCollapsed);
			item.collapseIcon?.toggleClass("is-collapsed", item.isCollapsed);
			item.childContainer.hide();
			item.childContainer.empty();
			item.children = [];
		}

		for (const child of item.children) {
			this.handleModifyRecursive(child, noteName);
		}
	}
}
