import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components/ui";
import { Input } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../../features/auth/schemas";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function ForgotPasswordScreen() {
  const requestPasswordReset = useSessionStore((state) => state.requestPasswordReset);
  const errorMessage = useSessionStore((state) => state.errorMessage);
  const clearError = useSessionStore((state) => state.clearError);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitSuccessful }
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values: ForgotPasswordValues) {
    clearError();
    await requestPasswordReset(values.email);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>We’ll send a reset link to the email tied to your account.</Text>
      </View>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.email?.message}
              />
            )}
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {isSubmitSuccessful && isSupabaseConfigured ? (
            <Text style={styles.success}>Check your email for the reset link.</Text>
          ) : null}
          {!isSupabaseConfigured ? (
            <Text style={styles.helper}>Add the Expo public Supabase env vars before requesting a reset.</Text>
          ) : null}
          <Button
            label="Send reset link"
            disabled={!isSupabaseConfigured}
            onPress={handleSubmit(onSubmit)}
          />
          <Link href="/sign-in" style={styles.link}>
            Back to sign in
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl * 1.5
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    fontWeight: "700"
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
  },
  form: {
    gap: theme.spacing.md
  },
  helper: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  success: {
    color: theme.colors.success,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  error: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  link: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  }
});
