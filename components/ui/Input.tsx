import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle
} from "react-native";

import { theme } from "../../constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helperText, errorText, containerStyle, style, ...props },
  ref
) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.muted}
        {...props}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          errorText && styles.errorInput,
          style
        ]}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: "top"
  },
  errorInput: {
    borderColor: theme.colors.danger
  },
  helperText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "600"
  }
});
