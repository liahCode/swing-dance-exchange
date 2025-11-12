import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(80, "Email address is too long")
    .trim()
    .toLowerCase()
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
