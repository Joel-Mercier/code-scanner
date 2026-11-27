// The in-memory file system of `__mocks__/expo-file-system.ts`, typed.
import * as mock from "../../__mocks__/expo-file-system";

export const fileSystem = mock.fileSystem;
export const pickDirectory = mock.Directory.pickDirectoryAsync;
/** The in-memory `Directory`, for a picker that hands one back. */
export const FakeDirectory = mock.Directory;
