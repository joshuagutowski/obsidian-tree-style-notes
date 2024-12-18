import {
	TFile,
	MetadataCache,
	LinkCache,
	FrontmatterLinkCache,
} from "obsidian";

export type NoteObj = {
	count: number;
	link: TFile | undefined;
	linkSet: Map<string, NoteObj>;
};

export const SortOrder = new Map<string, string>([
	["NUM_DESC", "Number of links (most to least)"],
	["NUM_ASC", "Number of links (least to most)"],
	["ALPH_ASC", "Note name (A to Z)"],
	["ALPH_DESC", "Note name (Z to A)"],
]);

export class NoteCache {
	links: Map<string, NoteObj> = new Map();

	createCache(
		files: TFile[],
		metadataCache: MetadataCache,
		includePotential: boolean,
	) {
		// build initial cache
		for (const file of files) {
			this.makeEntryFromFile(file, metadataCache);
		}

		for (const [name, note] of this.links) {
			// if !includePotential remove potenial notes from cache
			if (!includePotential) {
				if (!note.link) {
					this.links.delete(name);
					continue;
				}
				for (const [childName, childFile] of note.linkSet) {
					if (!childFile.link) {
						note.linkSet.delete(childName);
					}
				}
			}
			// get file counts
			note.count = note.linkSet.size;
		}
	}

	makeEntryFromFile(file: TFile, metadataCache: MetadataCache) {
		// create cache entry for this file
		const currentFile = this.getCacheEntry(file.basename);
		currentFile.link = file;

		// collect all links to iterate over
		const fileCache = metadataCache.getFileCache(file);
		let fileCacheLinks: (LinkCache | FrontmatterLinkCache)[] = [];
		if (fileCache && fileCache.links) {
			fileCacheLinks = [...fileCacheLinks, ...fileCache.links];
		}
		if (fileCache && fileCache.frontmatterLinks) {
			fileCacheLinks = [...fileCacheLinks, ...fileCache.frontmatterLinks];
		}

		// iterate over all links for this file
		for (const link of fileCacheLinks) {
			const cacheLink = this.getCacheEntry(link.link);
			if (!currentFile.linkSet.has(link.link)) {
				currentFile.linkSet.set(link.link, cacheLink);
			}
			if (!cacheLink.linkSet.has(file.basename)) {
				cacheLink.linkSet.set(file.basename, currentFile);
			}
		}
	}

	getCacheEntry(name: string): NoteObj {
		let entry = this.links.get(name);

		if (!entry) {
			entry = {
				count: 0,
				link: undefined,
				linkSet: new Map<string, NoteObj>(),
			};
			this.links.set(name, entry);
		}
		return entry;
	}

	renameCacheEntry(oldName: string, newName: string) {
		const note = this.links.get(oldName);
		if (note) {
			this.links.set(newName, note);
			this.links.delete(oldName);
			for (const [, noteObj] of this.links) {
				if (noteObj.linkSet.has(oldName)) {
					noteObj.linkSet.set(newName, note);
					noteObj.linkSet.delete(oldName);
				}
			}
		}
	}

	sort(order: string) {
		let sortFunc: (a: [string, NoteObj], b: [string, NoteObj]) => number;

		switch (order) {
			case "NUM_DESC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[1].count != b[1].count
						? b[1].count - a[1].count
						: a[0].localeCompare(b[0]);
				break;
			}
			case "NUM_ASC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[1].count != b[1].count
						? a[1].count - b[1].count
						: a[0].localeCompare(b[0]);
				break;
			}
			case "ALPH_ASC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[0].localeCompare(b[0]);
				break;
			}
			case "ALPH_DESC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					b[0].localeCompare(a[0]);
				break;
			}
			default: {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[1].count != b[1].count
						? b[1].count - a[1].count
						: a[0].localeCompare(b[0]);
				break;
			}
		}

		this.links = new Map([...this.links.entries()].sort(sortFunc));

		for (const [, note] of this.links) {
			note.linkSet = new Map([...note.linkSet.entries()].sort(sortFunc));
		}
	}

	clearCache() {
		this.links = new Map<string, NoteObj>();
	}
}
