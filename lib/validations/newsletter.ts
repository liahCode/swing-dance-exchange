import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(80, "Email address is too long")
    .trim()
    .toLowerCase()
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
