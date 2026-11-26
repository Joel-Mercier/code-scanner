import type { ViewStyle } from "react-native";

export * from "./contrast";
export * from "./layout";
export * from "./styles";
export * from "./tokens";
export * from "./useTheme";

export const boxShadow = (value: string): ViewStyle => ({ boxShadow: value });
