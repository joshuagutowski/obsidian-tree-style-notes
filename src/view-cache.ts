import { NoteObj } from "./note-cache";

export type ViewObj = {
	div: HTMLDivElement;
	note: NoteObj;
	children: ViewObj[]; //get passed by reference anyway, but how do I get their names?
};

export class ViewCache {
	divs: Map<string[], ViewObj> = new Map();
	container: Element;

	constructor(container: Element) {
		this.container = container;
	}
}
