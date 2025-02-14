# Tree Style Notes for Obsidian

View notes and their links in a tree style structure to easily discover linked ideas.

<img width="964" alt="tree-notes-example" src="https://github.com/user-attachments/assets/5d5d2446-4320-417c-a0c2-2454e7dd1a7a">

One of the greatest parts of Obsidian is the ability to link together ideas, and then see how they connect in the graph. When combined with the Zettelkasten method, this can lead to the generation of new insights and ideas.

But what I always found frustrating was that there wasn't a clearer overview of all the notes and how they are connected. The graph view, especially when you have a lot of notes, can become difficult to navigate, and difficult to see the links between notes that make this way of taking notes so valuable.

So I created Tree Style Notes, a view for Obsidian where you can see all your notes, and click on them to see the notes they link to, or which link to them.

## The Method

This plugin is created around the idea of using links instead of tags and the zettelkasten approach where all your notes are in the same folder. By linking to topics or ideas which are related to the note you are writing at the moment, it can help guide you on what to research or write about next and show you topics which your ideas are clustering around, which could potentially become Maps of Content.

The tree view allows you to work completely without folders, instead your notes are automatically grouped by topic based on how you’ve linked them, and notes can appear under several topics. You can also continue to recursively dig deeper into any idea by simply clicking to show all the linked notes.

### Usage

Simply click a note to expand, and see all the note’s incoming and outgoing links.

You can use ctrl/cmd+click to open a note or create a note which doesn’t exist yet. (If a note has no more links to display, just a normal click will also work).

Notes which already exist in your vault display in the standard text colour, and notes which don’t yet exist but are linked from other notes are highlighted.

To help keep things organised, parent notes are not displayed beneath their respective child notes. This may become an optional setting in the future.

View buttons:
- New note: creates a new untitled note in your vault.
- Sort order: allows you to select a sort order.
- Collapse: collapses all currently open notes and their children.
- Refresh: refreshes the tree in case of changes in the vault which aren’t reflected in the tree.

(Some actions like moving notes in and out of your selected folder aren't properly supported yet, so sometimes a refresh is necessary)

### Settings

In settings you can make the following changes:

1. Notes folder: Only notes from this folder will be displayed.
2. Link count cutoff: Set the cutoff for how many links a note needs to be show in the top level of the tree.
3. Include uncreated notes: Set whether notes which don’t exist yet are displayed in the tree.

## Manual Install

1. Download the release files.
2. Put the files into a folder named `obsidian-tree-style-notes` in your `.obsidian/plugins/` folder.
3. Activate the plugin from your Obsidian's community plugins tab in settings.

## Planned Features/Improvements

- [x] Retain open state within closed parent objects
- [x] Handle updating notes (renaming, links, etc.)
- [ ] Better handling for vault events & notes folder
- [ ] Add excluded folders/notes
- [ ] Open a note as a top level note in a new pane (for multiple trees at once)
- [ ] Add the ability to search

## Contributing

This is my first independent programming project, so I’m not sure yet how I will deal with contributions. You’re welcome to make a pull request or open an issue, but there is no guarantee I will merge it, let alone respond.
