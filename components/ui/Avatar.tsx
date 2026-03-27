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

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {resolvedSource ? (
        <Image source={resolvedSource} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
      )}
    </View>
  );
}

function buildInitials(name?: string) {
  if (!name) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.line,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden"
  },
  image: {
    resizeMode: "cover"
  },
  initials: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontWeight: "700"
  }
});
