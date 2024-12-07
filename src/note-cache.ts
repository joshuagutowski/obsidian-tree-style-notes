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
}

export const SortOrder = new Map<string, string>([
	["NUM_DESC", "Number of links (most to least)"],
	["NUM_ASC", "Number of links (least to most)"],
	["ALPH_ASC", "Note name (A to Z)"],
	["ALPH_DESC", "Note name (Z to A)"],
])

export class NoteCache {
	links: Map<string, NoteObj> = new Map();

	createCache(files: TFile[], metadataCache: MetadataCache, includePotential: boolean) {
		for (const file of files) {
			// Create cache entry for this file
			this.createCacheEntry(file.basename);
			const currentFile = this.links.get(file.basename);
			if (currentFile) {
				currentFile.link = file;
			}

			// Collect all links to iterate over
			const fileCache = metadataCache.getFileCache(file);
			let fileCacheLinks: (LinkCache | FrontmatterLinkCache)[] = [];
			if (fileCache) {
				if (fileCache.links) {
					fileCacheLinks = [...fileCacheLinks, ...fileCache.links]
				}
				if (fileCache.frontmatterLinks) {
					fileCacheLinks = [...fileCacheLinks, ...fileCache.frontmatterLinks]
				}
			}

			// Iterate over all links for this file
			for (const link of fileCacheLinks) {
				this.createCacheEntry(link.link);
				const cacheLink = this.links.get(link.link);
				if (currentFile && cacheLink) {
					if (!currentFile.linkSet.has(link.link)) {
						currentFile.linkSet.set(link.link, cacheLink);
					}
					if (!cacheLink.linkSet.has(file.basename)) {
						cacheLink.linkSet.set(file.basename, currentFile)
					}
				}
			}
		}

		// Get file counts after cache is built
		for (const [name, file] of this.links) {
			if (!includePotential) {
				if (!file.link) {
					this.links.delete(name);
					continue;
				}
				for (const [childName, childFile] of file.linkSet) {
					if (!childFile.link) {
						file.linkSet.delete(childName);
					}
				}
			}
			file.count = file.linkSet.size;
		}
	}

	createCacheEntry(name: string) {
		if (!this.links.has(name)) {
			this.links.set(name, {
				count: 0,
				link: undefined,
				linkSet: new Map<string, NoteObj>
			});
		}
	}

	clearCache() {
		this.links = new Map<string, NoteObj>;
	}

	sort(order: string) {
		let sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) => b[1].count - a[1].count

		switch (order) {
			case "NUM_DESC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) => (
					a[1].count != b[1].count
						? b[1].count - a[1].count
						: a[0].localeCompare(b[0])
				)
				break
			}
			case "NUM_ASC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) => (
					a[1].count != b[1].count
						? a[1].count - b[1].count
						: a[0].localeCompare(b[0])
				)
				break
			}
			case "ALPH_ASC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) => (
					a[0].localeCompare(b[0])
				)
				break
			}
			case "ALPH_DESC": {
				sortFunc = (a: [string, NoteObj], b: [string, NoteObj]) => (
					b[0].localeCompare(a[0])
				)
				break
			}
			default: {
				break
			}
		}

		this.links = new Map([...this.links.entries()].sort(sortFunc));

		for (const [, note] of this.links) {
			note.linkSet = new Map([...note.linkSet.entries()].sort(sortFunc));
		}
	}
}
