import { byId, makeFolder } from "@/test/fixtures";
import {
	descendantFolderIds,
	flattenFolderTree,
	folderAncestors,
} from "./folders";

// root ─┬─ travel ─┬─ japan ── kyoto
//       │          └─ alps
//       └─ bills
const folders = byId(
	makeFolder({ id: "travel", name: "Travel" }),
	makeFolder({ id: "japan", name: "Japan", parentId: "travel" }),
	makeFolder({ id: "kyoto", name: "Kyoto", parentId: "japan" }),
	makeFolder({ id: "alps", name: "Alps", parentId: "travel" }),
	makeFolder({ id: "bills", name: "Bills" }),
);

describe("descendantFolderIds", () => {
	it("includes the folder and everything nested in it", () => {
		expect([...descendantFolderIds(folders, "travel")].sort()).toEqual([
			"alps",
			"japan",
			"kyoto",
			"travel",
		]);
	});

	it("is just the folder for a leaf", () => {
		expect([...descendantFolderIds(folders, "kyoto")]).toEqual(["kyoto"]);
	});
});

describe("flattenFolderTree", () => {
	it("walks the tree depth first, sorted by name", () => {
		expect(
			flattenFolderTree(folders).map(({ folder, depth }) => [folder.id, depth]),
		).toEqual([
			["bills", 0],
			["travel", 0],
			["alps", 1],
			["japan", 1],
			["kyoto", 2],
		]);
	});

	it("leaves out an excluded folder and its subtree", () => {
		expect(
			flattenFolderTree(folders, "japan").map(({ folder }) => folder.id),
		).toEqual(["bills", "travel", "alps"]);
	});

	it("is empty without folders", () => {
		expect(flattenFolderTree({})).toEqual([]);
	});
});

describe("folderAncestors", () => {
	it("lists the folders above, from the root down", () => {
		expect(
			folderAncestors(folders, folders.kyoto).map((folder) => folder.id),
		).toEqual(["travel", "japan"]);
	});

	it("is empty at the top level or without a folder", () => {
		expect(folderAncestors(folders, folders.travel)).toEqual([]);
		expect(folderAncestors(folders, undefined)).toEqual([]);
	});

	it("stops at a parent that no longer exists", () => {
		const orphan = makeFolder({ id: "orphan", parentId: "gone" });
		expect(folderAncestors(byId(orphan), orphan)).toEqual([]);
	});
});
