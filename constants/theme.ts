import { Platform } from "react-native";

export const theme = {
  colors: {
    canvas: "#f4ede3",
    surface: "#fffaf4",
    surfaceStrong: "#efe1d2",
    text: "#1f1a17",
    muted: "#6d6257",
    line: "#e3d4c4",
    accent: "#bf5a2d",
    accentSoft: "#f4d1bf",
    success: "#2f7a57",
    danger: "#a44234",
    white: "#ffffff"
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 40
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    pill: 999
  },
  fonts: {
    display: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif"
    }),
    body: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "System"
    }),
    mono: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace"
    })
  },
  shadow: {
    card: {
      shadowColor: "#8c6a50",
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 6
    }
  }
} as const;
