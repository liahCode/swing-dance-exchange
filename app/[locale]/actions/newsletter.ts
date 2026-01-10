'use server';

import { newsletterSchema } from '@/lib/validations/newsletter';

export type FormState = {
  error?: string;
  success?: boolean;
  email?: string;
  isFake?: boolean;
} | null;

export async function subscribeToNewsletter(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate input using Zod
  const validatedFields = newsletterSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email } = validatedFields.data;

  // 2. Get API token from environment variable
  const apiToken = process.env.MAILERLITE_API_TOKEN;

  if (!apiToken) {
    return {
      error: 'Configuration error. Please try again later.',
    };
  }

  // 3. Call MailerLite API
  try {
    const requestBody = {
      email,
      status: 'unconfirmed', // This triggers double opt-in email
    };

    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 4. Handle MailerLite API responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Newsletter] API Error Response:', errorData);

      // Rate limit hit
      if (response.status === 429) {
        return { error: 'Too many requests. Please try again in a minute.' };
      }

      // Validation error (e.g., invalid email format)
      if (response.status === 422) {
        return { error: errorData.message || 'Invalid email address.' };
      }

      // Other errors
      console.error('MailerLite API error:', response.status, errorData);
      return { error: 'Unable to subscribe. Please try again later.' };
    }

    // Log successful response
    const responseData = await response.json();

    // 5. Success!
    return {
      success: true,
    };
  } catch (error) {
    // Network error or unexpected exception
    console.error('Newsletter subscription error:', error);
    return {
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

export async function subscribeToNewsletterFake(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
  // 1. Validate input using Zod
  const validatedFields = newsletterSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email } = validatedFields.data;

  // 2. Return success with email and fake flag (alert will be shown on client side)
  return {
    success: true,
    email,
    isFake: true,
  };
}