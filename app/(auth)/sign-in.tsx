import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          <Ionicons name="restaurant" size={28} color={theme.colors.accent} />
        </View>
        <Text style={styles.appName}>Recipebook</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue.</Text>
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
            <Text style={styles.helper}>Add the Supabase env vars to sign in.</Text>
          ) : null}
          <Button
            label="Sign in"
            loading={isSubmitting}
            disabled={!isSupabaseConfigured}
            fullWidth
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </Card>

      <View style={styles.links}>
        <Link href="/forgot-password" style={styles.link}>Forgot password?</Link>
        <Text style={styles.linkDivider}>·</Text>
        <Link href="/sign-up" style={styles.link}>Create an account</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxl
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  appName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 26
  },
  header: {
    gap: 4
  },
  title: {
    ...theme.type.hero,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  form: {
    gap: theme.spacing.md
  },
  helper: {
    ...theme.type.caption,
    color: theme.colors.muted,
    fontSize: 13
  },
  error: {
    ...theme.type.caption,
    color: theme.colors.danger,
    fontSize: 13
  },
  links: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "center"
  },
  link: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14
  },
  linkDivider: {
    color: theme.colors.muted,
    fontSize: 16
  }
});
