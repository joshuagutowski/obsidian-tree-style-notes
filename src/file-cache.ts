import {
	TFile,
	MetadataCache,
	LinkCache,
	FrontmatterLinkCache,
} from "obsidian";

type FileObj = {
	count: number;
	link: TFile | undefined;
	linkSet: Map<string, FileObj>;
}

export enum SortOrder {
	NUM_ASC,
	NUM_DESC,
	ALPH_ASC,
	ALPH_DESC,
}

export class FilesCache {
	links: Map<string, FileObj>;
	constructor(links: Map<string, FileObj>) {
		this.links = links;

	}

	sort(order: SortOrder) {
		let sortFunc = (a: [string, FileObj], b: [string, FileObj]) => b[1].count - a[1].count

		switch (order as SortOrder) {
			case SortOrder.NUM_ASC: {
				sortFunc = (a: [string, FileObj], b: [string, FileObj]) => a[1].count - b[1].count
				break
			}
			case SortOrder.NUM_DESC: {
				sortFunc = (a: [string, FileObj], b: [string, FileObj]) => b[1].count - a[1].count
				break
			}
			case SortOrder.ALPH_ASC: {
				sortFunc = (a: [string, FileObj], b: [string, FileObj]) => a[0].localeCompare(b[0])
				break
			}
			case SortOrder.ALPH_DESC: {
				sortFunc = (a: [string, FileObj], b: [string, FileObj]) => b[0].localeCompare(a[0])
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
	let cacheLinks = new Map<string, FileObj>;

	for (const file of files) {
		if (!cacheLinks.has(file.basename)) {
			cacheLinks.set(file.basename, {
				count: 0,
				link: undefined,
				linkSet: new Map<string, FileObj>
			})
		}

		const currentFile = cacheLinks.get(file.basename);
		if (currentFile) {
			currentFile.link = file;
		}

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

		for (const link of fileCacheLinks) {
			if (!cacheLinks.has(link.link)) {
				cacheLinks.set(link.link, {
					count: 0,
					link: undefined,
					linkSet: new Map<string, FileObj>
				})
			}
			const cacheLink = cacheLinks.get(link.link);
			if (currentFile && cacheLink) {
				if (!currentFile.linkSet.has(link.link)) {
					currentFile.linkSet.set(link.link, cacheLink);
				}
				if (!cacheLink.linkSet.has(file.basename)) {
					cacheLink.linkSet.set(file.basename, currentFile)
				}
				cacheLink.count++;
			}
		}

	}
	return new FilesCache(cacheLinks)
}
