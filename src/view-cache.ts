import { NoteObj } from "./note-cache";

export type ViewObj = {
	name: string;
	note: NoteObj;
	treeItem: HTMLDivElement;
	treeItemLabel: HTMLDivElement;
	treeItemName: HTMLDivElement;
	treeItemNumber: HTMLDivElement;
	isCollapsed: boolean;
	childContainer: HTMLDivElement;
	//children: Map<string, ViewObj>;
};

export class ViewCache {
	treeItems: Map<string[], ViewObj>;

	constructor() {
		this.treeItems = new Map();
	}

	clear() {
		this.treeItems.clear();
	}

	// all of these should be handled by the container?
	sort() {
		// sorts the whole container
	}

	render() {
		// renders all the tree items
	}

	changeActive(activeNote: string | undefined) {
		for (const [, item] of this.treeItems) {
			item.treeItemLabel.removeClass("is-active");

			if (item.name === activeNote) {
				item.treeItemLabel.addClass("is-active");
			}
			//this.changeActiveRecursive(item, activeNote);
		}
	}

	// changeActiveRecursive(item: ViewObj, activeNote: string | undefined) {
	// 	item.treeItemLabel.removeClass("is-active");

	// 	if (item.name === activeNote) {
	// 		item.treeItemLabel.addClass("is-active");
	// 	}

	// 	for (const [, child] of item.children) {
	// 		this.changeActiveRecursive(child, activeNote);
	// 	}
	// }

	handleCreate(noteName: string) {
		for (const [, item] of this.treeItems) {
			if (item.name === noteName) {
				item.treeItemName.removeClass("potential-note");
			}
		}
	}

	handleDelete(noteName: string) {
		for (const [, item] of this.treeItems) {
			if (item.name === noteName) {
				item.treeItemName.addClass("potential-note");
			}
		}
	}

	handleRename(oldName: string, newName: string) {
		for (const [path, item] of this.treeItems) {
			if (item.name === oldName) {
				item.treeItemName.setText(newName);
				item.name = newName;
			}

			// replace the name in any path which contains it
			const nameIndex = path.indexOf(oldName);
			if (nameIndex != -1) {
				path[nameIndex] = newName;
			}
		}
	}

	// can use path as name, but children should be in parent object, rather than all together in the same map
	handleModify(noteName: string) {
		for (const [, item] of this.treeItems) {
			// update link count for each element in viewCache
			item.treeItemNumber.setText(String(item.note.count));

			if (item.name === noteName || item.note.linkSet.has(noteName)) {
				// --- TODO ---
				// rerender this div, and delete all it's children from viewCache
				// needs to also update items which used to have this item in it's set
			}
		}
	}
}
