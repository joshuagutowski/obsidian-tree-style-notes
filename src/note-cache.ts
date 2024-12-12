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
		for (const file of files) {
			this.makeEntryFromFile(file, metadataCache);
		}

		for (const [name, note] of this.links) {
			// If !includePotential remove potenial notes from cache
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
			// Get file counts
			note.count = note.linkSet.size;
		}
	}

	makeEntryFromFile(file: TFile, metadataCache: MetadataCache) {
		// Create cache entry for this file
		const currentFile = this.getCacheEntry(file.basename);
		if (currentFile) {
			currentFile.link = file;
		}

		// Collect all links to iterate over
		const fileCache = metadataCache.getFileCache(file);
		let fileCacheLinks: (LinkCache | FrontmatterLinkCache)[] = [];
		if (fileCache && fileCache.links) {
			fileCacheLinks = [...fileCacheLinks, ...fileCache.links];
		}
		if (fileCache && fileCache.frontmatterLinks) {
			fileCacheLinks = [...fileCacheLinks, ...fileCache.frontmatterLinks];
		}

		// Iterate over all links for this file
		for (const link of fileCacheLinks) {
			const cacheLink = this.getCacheEntry(link.link);
			if (currentFile && cacheLink) {
				if (!currentFile.linkSet.has(link.link)) {
					currentFile.linkSet.set(link.link, cacheLink);
				}
				if (!cacheLink.linkSet.has(file.basename)) {
					cacheLink.linkSet.set(file.basename, currentFile);
				}
			}
		}
	}

	getCacheEntry(name: string): NoteObj | undefined {
		if (!this.links.has(name)) {
			this.links.set(name, {
				count: 0,
				link: undefined,
				linkSet: new Map<string, NoteObj>(),
			});
		}
		return this.links.get(name);
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

	updateCacheEntry(file: TFile, metadataCache: MetadataCache) {
		const cacheEntry = this.links.get(file.basename);
		let oldLinks: NoteObj[] = [];
		if (cacheEntry) {
			oldLinks = Array.from(cacheEntry.linkSet.values());
			cacheEntry.linkSet.clear();
			for (const note of oldLinks) {
				note.linkSet.delete(file.basename);
				note.count = note.linkSet.size;
			}
		}

		this.makeEntryFromFile(file, metadataCache);
		const newCacheEntry = this.links.get(file.basename);
		if (!newCacheEntry) {
			console.error(
				`updateCacheEntry Error: problem getting new cache entry for ${file.basename}`,
			);
			return;
		}
		for (const [, note] of newCacheEntry.linkSet) {
			note.linkSet.set(file.basename, newCacheEntry);
			note.count = note.linkSet.size;
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
