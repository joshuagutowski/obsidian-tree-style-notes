import {
	TFile,
} from "obsidian";

export interface TreeNotesSettings {
	searchFolder: string;
	topLevelCutoff: number;
	includeUncreated: boolean;
	sortOrder: string;
}

export const DEFAULT_SETTINGS: TreeNotesSettings = {
	searchFolder: ".",
	topLevelCutoff: 4,
	includeUncreated: true,
	sortOrder: "NUM_DESC",
};

export const VIEW_TYPE_TREENOTES = "tree-notes-view";

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

