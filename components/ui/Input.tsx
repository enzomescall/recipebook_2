import { forwardRef } from "react";
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

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
        style={[styles.input, props.multiline && styles.multiline, errorText && styles.errorInput, style]}
      />
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    ...theme.type.label,
    color: theme.colors.text
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  errorInput: { borderColor: theme.colors.danger },
  helperText: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  errorText: {
    ...theme.type.caption,
    color: theme.colors.danger
  }
});
