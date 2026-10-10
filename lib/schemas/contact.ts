import { z } from "zod";

export const contactReasons = [
  "general",
  "dogs",
  "volunteer",
  "donate",
  "partnership",
  "other",
] as const; // keeps literal types, so z.enum and t() keys are typed, not just string[]

/**
 * Shared by the client form (via zodResolver) and, later, the Server Action,
 * which must re-validate because Server Actions are public endpoints.
 *
 * Error messages are message *keys* (looked up under `ContactPage.errors`),
 * not display strings, so the same schema works for every locale on both sides.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "required").max(100, "tooLong"),
  email: z.email("invalidEmail").max(254, "tooLong"),
  reason: z.enum(contactReasons, "required"),
  message: z.string().trim().min(1, "required").max(2000, "tooLong"),
  // GDPR: explicit consent to processing the data we email to the team
  consent: z.boolean().refine((value) => value, "consentRequired"),
  // Honeypot: hidden from humans, so any value means a bot filled it in
  website: z.string().max(0),
});

export type ContactInput = z.input<typeof contactSchema>;
// equivalent to z.infer<typeof contactSchema>:
export type ContactValues = z.output<typeof contactSchema>;
