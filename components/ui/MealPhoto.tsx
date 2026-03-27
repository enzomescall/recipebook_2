import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../constants/theme";

type MealPhotoProps = {
  uri?: string | null;
  aspectRatio?: number;
  size?: number;
  style?: StyleProp<ImageStyle & ViewStyle>;
};

export function MealPhoto({ uri, aspectRatio, size, style }: MealPhotoProps) {
  const dimensionStyle = size
    ? { width: size, height: size }
    : aspectRatio
      ? { aspectRatio, width: "100%" as const }
      : { aspectRatio: 3 / 2, width: "100%" as const };

  if (!uri) {
    return (
      <View style={[styles.placeholder, dimensionStyle, style]}>
        <Ionicons name="restaurant-outline" size={size ? size * 0.3 : 28} color={theme.colors.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, dimensionStyle, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    justifyContent: "center"
  },
  image: {
    borderRadius: theme.radius.md
  }
});
