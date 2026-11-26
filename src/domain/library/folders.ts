import type { Folder } from "./types";

type Folders = Record<string, Folder>;

/** `rootId` and every folder nested under it. */
export const descendantFolderIds = (folders: Folders, rootId: string) => {
	const ids = new Set([rootId]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const folder of Object.values(folders)) {
			if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
				ids.add(folder.id);
				grew = true;
			}
		}
	}
	return ids;
};

/**
 * The folder tree, depth first and sorted by name, as a flat list.
 * `exclude` leaves out a folder and everything inside it.
 */
export const flattenFolderTree = (
	folders: Folders,
	exclude?: string,
): { folder: Folder; depth: number }[] => {
	const children = (parentId: string | null) =>
		Object.values(folders)
			.filter((folder) => folder.parentId === parentId && folder.id !== exclude)
			.sort((a, b) => a.name.localeCompare(b.name));
	const result: { folder: Folder; depth: number }[] = [];
	const walk = (parentId: string | null, depth: number) => {
		for (const folder of children(parentId)) {
			result.push({ folder, depth });
			walk(folder.id, depth + 1);
		}
	};
	walk(null, 0);
	return result;
};

/** The folders above `folder`, from the root down. */
export const folderAncestors = (folders: Folders, folder?: Folder) => {
	const ancestors: Folder[] = [];
	for (
		let parent = folder?.parentId ? folders[folder.parentId] : undefined;
		parent;
		parent = parent.parentId ? folders[parent.parentId] : undefined
	) {
		ancestors.unshift(parent);
	}
	return ancestors;
};
