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

type FilesCache = {
	//existingLinks: Map<string, existingFileObj>;
	//potentialLinks: Map<string, potentialFileObj>;
	links: Map<string, number>;
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
	return { links: cacheLinks }
}
