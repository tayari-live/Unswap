import { z } from "zod"

/*
 * Authentication schemas.
 *
 * Deliberately free of React and server imports so the same definition runs in
 * both places: the form validates as the member types, and the service
 * validates again on submit. Previously each side had its own rules, and they
 * had already drifted — the client checked length while the documented policy
 * asked for four character classes that were never enforced anywhere.
 */

/** Reusable so a message reads the same wherever an address is collected. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .toLowerCase()

/**
 * Password policy.
 *
 * Each rule is checked separately so the member is told which one is missing,
 * rather than being handed the whole policy after every attempt.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[0-9]/, "Password must contain a number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character.")

const nameSchema = (field: string) =>
  z.string().trim().min(1, `Enter your ${field}.`).max(80, `Your ${field} is too long.`)

export const registerSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  email: emailSchema,
  password: passwordSchema,
})
export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Confirmation is matched with `refine` and the error attached to the confirm
 * field, so it appears under the input the member needs to correct.
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Both passwords must match.",
    path: ["confirm"],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "Both passwords must match.",
    path: ["confirm"],
  })
  // Caught here rather than at the server round-trip, which would otherwise be
  // the first time the member hears about it.
  .refine((v) => v.current !== v.next, {
    message: "Your new password must be different from your current one.",
    path: ["next"],
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const forgotPasswordSchema = z.object({ email: emailSchema })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Turn a Zod failure into the first message for each field.
 *
 * Services throw a single ApiError rather than a field map, so this keeps the
 * server able to report the most useful message without changing that contract.
 */
export function firstError(result: z.ZodError): string {
  return result.issues[0]?.message ?? "Please check the details you entered."
}
