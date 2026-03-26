import { z } from "zod";

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, or underscores."),
  bio: z.string().max(280, "Bio must be 280 characters or less."),
  profileImageUrl: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^https?:\/\//.test(value), "Enter a valid image URL.")
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
