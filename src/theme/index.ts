import type { ViewStyle } from "react-native";

export * from "./fonts";
export * from "./layout";
export * from "./styles";
export * from "./tokens";
export * from "./useTheme";

/** A `boxShadow` style (a CSS shadow string, as in `shadows`). */
export const boxShadow = (value: string): ViewStyle => ({ boxShadow: value });
