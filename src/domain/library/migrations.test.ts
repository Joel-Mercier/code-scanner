import type { LibraryItem } from "@/domain/library/types";
import { byId, makeCode, makeDoc, makeFolder } from "@/test/fixtures";
import { LIBRARY_VERSION, migrateLibrary } from "./migrations";

describe("migrateLibrary", () => {
	it("is at version 5", () => {
		// Changing the persisted shape means a new version and a new step here.
		expect(LIBRARY_VERSION).toBe(5);
	});

	it("keeps v4 data as it is (v5 only added the optional `lockedAt`)", () => {
		const v4 = {
			items: byId<LibraryItem>(makeCode({ id: "c" }), makeDoc({ id: "d" })),
			folders: {},
			nextSeq: 3,
		};
		expect(migrateLibrary(v4, 4)).toEqual(v4);
	});

	describe("from v1", () => {
		const v1 = {
			items: {
				late: { ...makeCode({ id: "late", createdAt: 30 }), seq: undefined },
				early: {
					...makeCode({
						id: "early",
						createdAt: 10,
						source: "created",
						style: { color: "grape", background: "lemon" },
					}),
					seq: undefined,
				},
				middle: { ...makeDoc({ id: "middle", createdAt: 20 }), seq: undefined },
				custom: {
					...makeCode({
						id: "custom",
						createdAt: 40,
						data: "x",
						style: { color: "#101010", background: "#fefefe" },
					}),
					seq: undefined,
				},
			},
			folders: {
				a: {
					id: "a",
					name: "A",
					parentId: null,
					createdAt: 0,
					color: "mint",
					emoji: "🍕",
				},
				b: {
					id: "b",
					name: "B",
					parentId: "a",
					createdAt: 0,
					color: "neon",
					emoji: "🦄",
				},
			},
		};
		const migrated = migrateLibrary(v1, 1);

		it("numbers items in order of arrival", () => {
			expect(migrated.items.early.seq).toBe(1);
			expect(migrated.items.middle.seq).toBe(2);
			expect(migrated.items.late.seq).toBe(3);
			expect(migrated.items.custom.seq).toBe(4);
			expect(migrated.nextSeq).toBe(5);
		});

		it("turns old colour presets into their exact colour", () => {
			expect(migrated.items.early).toMatchObject({
				style: { color: "#5B3CC4", background: "#FFF5CC" },
			});
			expect(migrated.items.custom).toMatchObject({
				style: { color: "#101010", background: "#fefefe" },
			});
		});

		it("maps folder emojis to icons and old colours to new ones", () => {
			expect(migrated.folders.a).toEqual({
				id: "a",
				name: "A",
				parentId: null,
				createdAt: 0,
				color: "green",
				icon: "food",
			});
			expect(migrated.folders.b).toMatchObject({
				color: "blue",
				icon: "folder",
				parentId: "a",
			});
			expect(migrated.folders.b).not.toHaveProperty("emoji");
		});

		it("also applies the later steps", () => {
			const numeric = migrateLibrary(
				{
					items: { x: makeCode({ id: "x", format: 32 as never }) },
					folders: {},
				},
				1,
			);
			expect(numeric.items.x).toMatchObject({ format: "ean13", seq: 1 });
		});

		it("copes with an empty state", () => {
			expect(migrateLibrary({}, 1)).toEqual({
				items: {},
				folders: {},
				nextSeq: 1,
			});
		});
	});

	describe("from v2", () => {
		it("normalises numeric barcode formats and keeps everything else", () => {
			const state = {
				items: byId<LibraryItem>(
					makeCode({ id: "n", format: "256" as never }),
					makeCode({ id: "s", format: "ean8" }),
					makeDoc({ id: "d" }),
				),
				folders: byId(makeFolder({ id: "f" })),
				nextSeq: 9,
			};
			const migrated = migrateLibrary(state, 2);
			expect(migrated.items.n).toMatchObject({ format: "qr" });
			expect(migrated.items.s).toEqual(state.items.s);
			expect(migrated.items.d).toEqual(state.items.d);
			expect(migrated.folders).toBe(state.folders);
			expect(migrated.nextSeq).toBe(9);
		});
	});

	describe("from v3", () => {
		it("keeps only the file names of a document's pages and PDF", () => {
			const doc = {
				...makeDoc({
					id: "d",
					pages: [
						"file:///var/mobile/Containers/Data/Application/OLD/Documents/documents/d/page-1.jpg",
						"file:///var/mobile/Containers/Data/Application/OLD/Documents/documents/d/page-2.png",
					],
				}),
				pdfUri:
					"file:///var/mobile/Containers/Data/Application/OLD/Documents/documents/d/document.pdf",
			};
			const state = {
				items: byId<LibraryItem>(makeCode({ id: "c" }), doc as LibraryItem),
				folders: {},
				nextSeq: 3,
			};
			const migrated = migrateLibrary(state, 3);
			expect(migrated.items.d).toEqual({
				...makeDoc({ id: "d", pages: ["page-1.jpg", "page-2.png"] }),
				pdf: "document.pdf",
			});
			expect(migrated.items.c).toBe(state.items.c);
		});

		it("leaves documents without a PDF without one", () => {
			const state = {
				items: byId<LibraryItem>(
					makeDoc({ id: "d", pages: ["file:///x/p.jpg"] }),
				),
				folders: {},
				nextSeq: 2,
			};
			expect(migrateLibrary(state, 3).items.d).not.toHaveProperty("pdf");
		});
	});

	it("leaves current data untouched", () => {
		const state = { items: byId(makeCode()), folders: {}, nextSeq: 2 };
		expect(migrateLibrary(state, LIBRARY_VERSION)).toBe(state);
	});
});
