import { Image, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "../../constants/theme";

type AvatarProps = {
  name?: string;
  uri?: string | null;
  source?: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ name, uri, source, size = 48, style }: AvatarProps) {
  const initials = buildInitials(name);
  const resolvedSource = source ?? (uri ? { uri } : undefined);
  const r = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: r }, style]}>
      {resolvedSource ? (
        <Image source={resolvedSource} style={{ width: size, height: size, borderRadius: r }} resizeMode="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

function buildInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    justifyContent: "center",
    overflow: "hidden"
  },
  initials: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold
  }
});
