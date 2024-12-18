import { NoteObj } from "./note-cache";

export type ViewObj = {
	note: NoteObj;
	treeItem: HTMLDivElement;
	treeItemLabel: HTMLDivElement;
	treeItemName: HTMLDivElement;
	treeItemNumber: HTMLDivElement;
	isCollapsed: boolean;
	childContainer: HTMLDivElement | null;
	children: ViewObj[]; //get passed by reference anyway, but how do I get their names?
};

export class ViewCache {
	divs: Map<string[], ViewObj>;
	container: Element;

	constructor(container: Element) {
		this.container = container;
		this.divs = new Map();
	}

	clear() {
		this.container.empty();
		this.divs.clear();
	}

	new(
		path: string[],
		note: NoteObj,
		treeItem: HTMLDivElement,
		treeItemLabel: HTMLDivElement,
		treeItemName: HTMLDivElement,
		treeItemNumber: HTMLDivElement,
	): ViewObj {
		const newTreeItem: ViewObj = {
			note: note,
			treeItem: treeItem,
			treeItemLabel: treeItemLabel,
			treeItemName: treeItemName,
			treeItemNumber: treeItemNumber,
			isCollapsed: false,
			childContainer: null,
			children: [],
		};
		this.divs.set(path, newTreeItem);
		return newTreeItem;
	}

	sort() {
		this.container.empty();
		// sorts the whole container
	}

	changeActive(noteName: string | undefined) {
		for (const [path, div] of this.divs) {
			div.treeItemLabel.removeClass("is-active");

			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				div.treeItemLabel.addClass("is-active");
			}
		}
	}

	handleCreate(noteName: string) {
		for (const [path, div] of this.divs) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				div.treeItemName.removeClass("potential-note");
			}
		}
	}

	handleDelete(noteName: string) {
		for (const [path, div] of this.divs) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === noteName) {
				div.treeItemName.addClass("potential-note");
			}
		}
	}

	handleRename(oldName: string, newName: string) {
		for (const [path, div] of this.divs) {
			const nameInPath = path[path.length - 1];
			if (nameInPath === oldName) {
				div.treeItemName.setText(newName);
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
		for (const [path, div] of this.divs) {
			const nameInPath = path[path.length - 1];

			// update link count for each element in viewCache
			const note = this.noteCache.notes.get(nameInPath);
			if (!note) {
				console.error(
					`handleModify Error: couldn't update count for ${nameInPath}`,
				);
				continue;
			}
			div.treeItemNumber.setText(String(note.count));

			if (nameInPath === noteName || note.linkSet.has(noteName)) {
				// --- TODO ---
				// rerender this div, and delete all it's children from viewCache
			}
		}
	}
}
