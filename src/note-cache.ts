import {
	TFile,
	MetadataCache,
	LinkCache,
	FrontmatterLinkCache,
} from "obsidian";

import { TreeNotesPlugin } from "./tree-notes-plugin";

export type NoteObj = {
	count: number;
	link: TFile | undefined;
	linkSet: Map<string, NoteObj>;
};

export enum SortOrder {
	NUM_DESC = "Number of links (most to least)",
	NUM_ASC = "Number of links (least to most)",
	ALPH_ASC = "Note name (A to Z)",
	ALPH_DESC = "Note name (Z to A)",
}

export class NoteCache {
	notes: Map<string, NoteObj> = new Map();
	plugin: TreeNotesPlugin;

	constructor(plugin: TreeNotesPlugin) {
		this.plugin = plugin;
	}

	createCache(files: TFile[], metadataCache: MetadataCache) {
		const filteredFiles = files.filter((file) => {
			return file.path.startsWith(this.plugin.settings.rootFolder);
		});

		for (const file of filteredFiles) {
			this.makeEntry(file, metadataCache);
		}

		for (const [, note] of this.notes) {
			note.count = note.linkSet.size;
		}
	}

	makeEntry(file: TFile, metadataCache: MetadataCache) {
		if (!file.path.startsWith(this.plugin.settings.rootFolder)) {
			return;
		}

		// create cache entry for this file
		const currentFile = this.getEntry(file.basename);
		currentFile.link = file;

		// collect all outgoing links to iterate over
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
			const linkedFile = metadataCache.getFirstLinkpathDest(
				link.link,
				file.path,
			);

			if (!this.plugin.settings.includePotential && !linkedFile) {
				continue;
			}

			if (
				linkedFile &&
				!linkedFile.path.startsWith(this.plugin.settings.rootFolder)
			) {
				continue;
			}

			const cacheLink = this.getEntry(link.link);
			if (!currentFile.linkSet.has(link.link)) {
				currentFile.linkSet.set(link.link, cacheLink);
			}
			if (!cacheLink.linkSet.has(file.basename)) {
				cacheLink.linkSet.set(file.basename, currentFile);
			}
		}
	}

	getEntry(name: string): NoteObj {
		let entry = this.notes.get(name);

		if (!entry) {
			entry = {
				count: 0,
				link: undefined,
				linkSet: new Map<string, NoteObj>(),
			};
			this.notes.set(name, entry);
		}
		return entry;
	}

	renameEntry(oldName: string, newName: string) {
		const note = this.notes.get(oldName);
		if (note) {
			this.notes.set(newName, note);
			this.notes.delete(oldName);
			for (const [, noteObj] of this.notes) {
				if (noteObj.linkSet.has(oldName)) {
					noteObj.linkSet.set(newName, note);
					noteObj.linkSet.delete(oldName);
				}
			}
		}
	}

	updateEntry(file: TFile, metadataCache: MetadataCache) {
		const cacheEntry = this.notes.get(file.basename);
		let oldLinks: NoteObj[] = [];
		if (cacheEntry) {
			oldLinks = Array.from(cacheEntry.linkSet.values());
			cacheEntry.linkSet.clear();
			for (const note of oldLinks) {
				note.linkSet.delete(file.basename);
				note.count = note.linkSet.size;
			}
		}

		this.makeEntry(file, metadataCache);
		const newCacheEntry = this.notes.get(file.basename);
		if (!newCacheEntry) {
			console.error(
				`updateCacheEntry Error: problem getting new cache entry for ${file.basename}`,
			);
			return;
		}

		for (const note of oldLinks) {
			if (note.link) {
				this.makeEntry(note.link, metadataCache);
			}
		}

		newCacheEntry.count = newCacheEntry.linkSet.size;

		for (const [, note] of newCacheEntry.linkSet) {
			note.linkSet.set(file.basename, newCacheEntry);
			note.count = note.linkSet.size;
		}
		this.sort();
	}

	sort() {
		let sortFunc: (a: [string, NoteObj], b: [string, NoteObj]) => number;

		switch (this.plugin.settings.sortOrder) {
			case SortOrder.NUM_DESC: {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[1].count != b[1].count
						? b[1].count - a[1].count
						: a[0].localeCompare(b[0]);
				break;
			}
			case SortOrder.NUM_ASC: {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[1].count != b[1].count
						? a[1].count - b[1].count
						: a[0].localeCompare(b[0]);
				break;
			}
			case SortOrder.ALPH_ASC: {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) =>
					a[0].localeCompare(b[0]);
				break;
			}
			case SortOrder.ALPH_DESC: {
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

		this.notes = new Map([...this.notes.entries()].sort(sortFunc));

		for (const [, note] of this.notes) {
			note.linkSet = new Map([...note.linkSet.entries()].sort(sortFunc));
		}
	}

	clear() {
		this.notes.clear();
	}
}
