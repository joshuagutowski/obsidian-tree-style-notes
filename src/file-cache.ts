import {
	TFile,
	MetadataCache,
} from "obsidian";

type FileObj = {
	name: string;
	existingLinks: Set<string>;
	potentialLinks: Set<string>;
	linkCount: number;
}

interface existingFileObj extends FileObj {
	path: string;
}

interface potentialFileObj extends FileObj {
	path: string;
}

export enum SortOrder {
	NUM_ASC,
	NUM_DESC,
	ALPH_ASC,
	ALPH_DESC,
}

class FilesCache {
	links: Map<string, number>;
	constructor(links: Map<string, number>) {
		this.links = links;

	}
	//existingLinks: Map<string, existingFileObj>;
	//potentialLinks: Map<string, potentialFileObj>;

	sort(order: SortOrder) {
		let sortFunc = (a: [string, number], b: [string, number]) => b[1] - a[1]

		switch (order as SortOrder) {
			case SortOrder.NUM_ASC: {
				sortFunc = (a: [string, number], b: [string, number]) => a[1] - b[1]
				break
			}
			case SortOrder.NUM_DESC: {
				sortFunc = (a: [string, number], b: [string, number]) => b[1] - a[1]
				break
			}
			case SortOrder.ALPH_ASC: {
				sortFunc = (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0])
				break
			}
			case SortOrder.ALPH_DESC: {
				sortFunc = (a: [string, number], b: [string, number]) => b[0].localeCompare(a[0])
				break
			}
			default: {
				break
			}
		}

		this.links = new Map([...this.links.entries()].sort(sortFunc));
	}
}

export function createCache(files: TFile[], metadataCache: MetadataCache): FilesCache {
	let cacheLinks = new Map<string, number>()

	for (const file of files) {
		if (!cacheLinks.has(file.basename)) {
			cacheLinks.set(file.basename, 0)
		}

		const fileCache = metadataCache.getFileCache(file);

		if (fileCache && fileCache.links) {
			for (const link of fileCache.links) {
				cacheLinks.set(link.link, (cacheLinks.get(link.link) ?? 0) + 1)
			}
		}

		if (fileCache && fileCache.frontmatterLinks) {
			for (const link of fileCache.frontmatterLinks) {
				cacheLinks.set(link.link, (cacheLinks.get(link.link) ?? 0) + 1)
			}
		}
	}
	return new FilesCache(cacheLinks)
}
