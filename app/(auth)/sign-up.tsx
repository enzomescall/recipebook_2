import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, Input } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { signUpSchema, type SignUpValues } from "../../features/auth/schemas";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function SignUpScreen() {
  const signUp = useSessionStore((state) => state.signUp);
  const errorMessage = useSessionStore((state) => state.errorMessage);
  const clearError = useSessionStore((state) => state.clearError);
  const status = useSessionStore((state) => state.status);
  const isSubmitting = status === "loading";
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: SignUpValues) {
    clearError();
    await signUp(values);
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start building your meal library.</Text>
      </View>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Display name"
                placeholder="Alex"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.displayName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Username"
                placeholder="alexcooks"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.username?.message}
              />
            )}
          />
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
                placeholder="Create a password"
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
            <Text style={styles.helper}>Add the Supabase env vars before creating an account.</Text>
          ) : null}
          <Button
            label="Create account"
            loading={isSubmitting}
            disabled={!isSupabaseConfigured}
            fullWidth
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </Card>

      <View style={styles.links}>
        <Link href="/sign-in" style={styles.link}>Already have an account? Sign in</Link>
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
    fontFamily: theme.fonts.display,
    fontSize: 26,
    fontWeight: "700"
  },
  header: {
    gap: 4
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    fontWeight: "700"
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15
  },
  form: {
    gap: theme.spacing.md
  },
  helper: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  error: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  links: {
    alignItems: "center",
    justifyContent: "center"
  },
  link: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  }
});
