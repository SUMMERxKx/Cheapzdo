import { z } from "zod";

// Shared auth form rules. Same schemas back the forms and any server side checks.
export const emailField = z.string().trim().email("Enter a valid email");
export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "That is too long");

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, "Tell us your name").max(80),
  email: emailField,
  password: passwordField,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({ email: emailField });
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const updatePasswordSchema = z
  .object({
    password: passwordField,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "The passwords do not match",
    path: ["confirm"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
