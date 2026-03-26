import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, Input } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { signInSchema, type SignInValues } from "../../features/auth/schemas";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function SignInScreen() {
  const signIn = useSessionStore((state) => state.signIn);
  const errorMessage = useSessionStore((state) => state.errorMessage);
  const clearError = useSessionStore((state) => state.clearError);
  const status = useSessionStore((state) => state.status);
  const isSubmitting = status === "loading";
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: SignInValues) {
    clearError();
    await signIn(values.email, values.password);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Pick up your recipes, rankings, and social feed where you left off.</Text>
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
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Password"
                placeholder="Your password"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.password?.message}
              />
            )}
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {!isSupabaseConfigured ? (
            <Text style={styles.helper}>Add the Expo public Supabase env vars before signing in.</Text>
          ) : null}
          <Button
            label="Sign in"
            loading={isSubmitting}
            disabled={!isSupabaseConfigured}
            onPress={handleSubmit(onSubmit)}
          />
          <Link href="/forgot-password" style={styles.link}>
            Forgot your password?
          </Link>
          <Link href="/sign-up" style={styles.link}>
            New here? Create an account
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
