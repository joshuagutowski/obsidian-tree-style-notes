import { NoteObj } from "./note-cache";

export type ViewObj = {
	note: NoteObj;
	treeItem: HTMLDivElement;
	treeItemLabel: HTMLDivElement;
	treeItemName: HTMLDivElement;
	treeItemNumber: HTMLDivElement;
	isCollapsed: boolean;
	childContainer: HTMLDivElement | null;
	//children: ViewObj[]; //get passed by reference anyway, but how do I get their names?
};

export class ViewCache {
	treeItems: Map<string[], ViewObj>;
	notesContainer: Element;

	constructor() {
		this.treeItems = new Map();
	}

	clear() {
		this.notesContainer.empty();
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
		for (const [path, item] of this.treeItems) {
			item.treeItemLabel.removeClass("is-active");

			const nameInPath = path[path.length - 1];
			if (nameInPath === activeNote) {
				item.treeItemLabel.addClass("is-active");
			}
		}
	}

	handleCreate(noteName: string) {
		for (const [path, item] of this.treeItems) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				item.treeItemName.removeClass("potential-note");
			}
		}
	}

	handleDelete(noteName: string) {
		for (const [path, item] of this.treeItems) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				item.treeItemName.addClass("potential-note");
			}
		}
	}

	handleRename(oldName: string, newName: string) {
		for (const [path, item] of this.treeItems) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === oldName) {
				item.treeItemName.setText(newName);
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
		for (const [path, item] of this.treeItems) {
			const nameInPath = path[path.length - 1];

			// update link count for each element in viewCache
			const note = this.noteCache.notes.get(nameInPath);
			if (!note) {
				console.error(
					`handleModify Error: couldn't update count for ${nameInPath}`,
				);
				continue;
			}
			item.treeItemNumber.setText(String(note.count));

			if (nameInPath === noteName || note.linkSet.has(noteName)) {
				// --- TODO ---
				// rerender this div, and delete all it's children from viewCache
			}
		}
	}
}
