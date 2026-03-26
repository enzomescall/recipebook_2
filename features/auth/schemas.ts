import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const signUpSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, or underscores."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.")
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
