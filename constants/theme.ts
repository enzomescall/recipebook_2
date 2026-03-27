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
    white: "#ffffff",
    overlay: "rgba(31, 26, 23, 0.45)"
  },
  fonts: {
    display: "Lora_700Bold",
    body: "DMSans_400Regular",
    mono: "monospace",
    serif: "Lora_400Regular",
    serifMedium: "Lora_500Medium",
    serifSemiBold: "Lora_600SemiBold",
    serifBold: "Lora_700Bold",
    sans: "DMSans_400Regular",
    sansMedium: "DMSans_500Medium",
    sansSemiBold: "DMSans_600SemiBold",
    sansBold: "DMSans_700Bold"
  },
  type: {
    hero: { fontFamily: "Lora_700Bold", fontSize: 32, lineHeight: 38 },
    title: { fontFamily: "Lora_600SemiBold", fontSize: 20, lineHeight: 26 },
    body: { fontFamily: "DMSans_400Regular", fontSize: 15, lineHeight: 22 },
    bodyMedium: { fontFamily: "DMSans_500Medium", fontSize: 15, lineHeight: 22 },
    label: { fontFamily: "DMSans_600SemiBold", fontSize: 13, lineHeight: 18 },
    caption: { fontFamily: "DMSans_500Medium", fontSize: 12, lineHeight: 16 }
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999
  },
  shadow: {
    card: {
      shadowColor: "#8c6a50",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3
    }
  }
} as const;
