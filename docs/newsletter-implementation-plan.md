# Newsletter Implementation Plan - Server Actions Approach

**Approach:** Next.js 15 Server Actions + MailerLite API + Double Opt-In
**Location:** PhysicsHero component (hero section)
**Hosting:** Netlify
**Timeline:** ~4-6 hours implementation time

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Implementation Steps](#implementation-steps)
4. [Local Testing Guide](#local-testing-guide)
5. [Production Deployment](#production-deployment)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Before Starting

- [ ] **MailerLite Account** - Sign up at https://www.mailerlite.com (free up to 1,000 subscribers)
- [ ] **MailerLite API Token** - Generate from Settings → Integrations → Developer API
- [ ] **Double opt-in enabled** - Settings → Forms & Popups → Enable double opt-in for API
- [ ] **Node.js** installed (already have this for Next.js)
- [ ] **Access to project repository**

### Get Your MailerLite API Token

1. Log into MailerLite: https://app.mailerlite.com
2. Navigate to: **Settings** → **Integrations** → **Developer API**
3. Click **"Generate new token"**
4. Give it a name: `Swing Dance Exchange Website`
5. **COPY THE TOKEN** - You won't see it again!
6. Keep it secure - this is like a password

**Example token format:**
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

---

## Local Development Setup

### Step 1: Create `.env.local` File

In your project root (`/home/nikolai/Desktop/swing-dance-exchange/`), create a file named `.env.local`:

```bash
# .env.local
MAILERLITE_API_TOKEN=your_actual_token_here
```

**IMPORTANT:**
- ✅ Replace `your_actual_token_here` with your actual API token
- ✅ This file is already in `.gitignore` - NEVER commit it to git
- ✅ Use `MAILERLITE_API_TOKEN` (not `NEXT_PUBLIC_...`) to keep it server-side only
- ✅ Restart dev server after creating this file

### Step 2: Verify `.gitignore` Includes `.env.local`

Check that your `.gitignore` file contains:

```gitignore
# local env files
.env*.local
.env.local
```

If not, add it immediately to prevent accidentally committing secrets.

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd /home/nikolai/Desktop/swing-dance-exchange
npm install zod
```

**Why Zod?** Type-safe email validation with clear error messages.

---

### Step 2: Create Validation Schema

**File:** `lib/validations/newsletter.ts`

```typescript
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
```

**Purpose:**
- Server-side validation (never trust client input)
- Clear, user-friendly error messages
- Automatic email normalization (trim whitespace, lowercase)

---

### Step 3: Create Server Action

**File:** `app/[locale]/actions/newsletter.ts`

```typescript
'use server';

import { newsletterSchema } from '@/lib/validations/newsletter';

export type FormState = {
  error?: string;
  success?: boolean;
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
      error: validatedFields.error.errors[0].message,
    };
  }

  const { email } = validatedFields.data;

  // 2. Get API token from environment variable
  const apiToken = process.env.MAILERLITE_API_TOKEN;

  if (!apiToken) {
    console.error('MAILERLITE_API_TOKEN not configured');
    return {
      error: 'Configuration error. Please try again later.',
    };
  }

  // 3. Call MailerLite API
  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        status: 'unconfirmed', // This triggers double opt-in email
      }),
    });

    // 4. Handle MailerLite API responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

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
```

**Key Features:**
- ✅ Server-side only (never exposes API token)
- ✅ Built-in CSRF protection via Server Actions
- ✅ Clear error handling for all scenarios
- ✅ Logging for debugging
- ✅ Type-safe with TypeScript

---

### Step 4: Create Newsletter Form Component

**File:** `components/NewsletterForm.tsx`

```typescript
'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { subscribeToNewsletter } from '@/app/[locale]/actions/newsletter';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm() {
  const t = useTranslations('newsletter');
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, null);

  return (
    <div className={styles.container}>
      {state?.success ? (
        // Success state - show confirmation message
        <div className={styles.success} role="status">
          <p className={styles.successTitle}>✓ {t('successTitle')}</p>
          <p className={styles.successMessage}>{t('successMessage')}</p>
        </div>
      ) : (
        // Default state - show form
        <form action={formAction} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder={t('placeholder')}
              required
              disabled={isPending}
              className={styles.input}
              aria-label={t('ariaLabel')}
              aria-invalid={state?.error ? 'true' : 'false'}
              aria-describedby={state?.error ? 'newsletter-error' : undefined}
            />
            <button
              type="submit"
              disabled={isPending}
              className={styles.button}
            >
              {isPending ? t('subscribing') : t('subscribe')}
            </button>
          </div>

          {state?.error && (
            <p id="newsletter-error" className={styles.error} role="alert">
              {state.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
```

**Key Features:**
- ✅ Uses `useActionState` (React 19 - modern approach)
- ✅ Built-in loading state with `isPending`
- ✅ Accessible (ARIA labels, roles, error descriptions)
- ✅ Internationalized with next-intl
- ✅ Shows success message after submission
- ✅ Automatically resets on success

---

### Step 5: Create Styles

**File:** `components/NewsletterForm.module.css`

```css
.container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inputGroup {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(171, 178, 198, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Sukhumvit Set', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: rgba(255, 255, 255, 0.9);
  color: #6a453a;
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #5289b5;
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.5);
}

.input[aria-invalid="true"] {
  border-color: #d32f2f;
}

.button {
  padding: 0.75rem 1.5rem;
  background: #5289b5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Sukhumvit Set', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.button:hover:not(:disabled) {
  background: #4a7aa3;
  transform: translateY(-1px);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin: 0;
  padding: 0.5rem;
  background: rgba(211, 47, 47, 0.1);
  border-radius: 6px;
  border-left: 3px solid #d32f2f;
}

.success {
  text-align: center;
  padding: 1.5rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  border: 2px solid rgba(76, 175, 80, 0.3);
}

.successTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 0.5rem 0;
}

.successMessage {
  font-size: 0.95rem;
  color: #388e3c;
  margin: 0;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .inputGroup {
    flex-direction: column;
  }

  .button {
    width: 100%;
  }
}
```

**Design Considerations:**
- Matches corporate design (Sukhumvit Set font, #5289b5 blue, #6a453a brown)
- Smooth transitions and hover effects
- Mobile-responsive (stacks on small screens)
- Clear visual feedback for errors and success
- Accessible contrast ratios

---

### Step 6: Add Translation Keys

**Files:** `messages/en.json` and `messages/de.json`

Add to `messages/en.json`:
```json
{
  "newsletter": {
    "placeholder": "your@email.com",
    "subscribe": "Subscribe",
    "subscribing": "Subscribing...",
    "ariaLabel": "Email address for newsletter",
    "successTitle": "Check your email!",
    "successMessage": "We've sent you a confirmation email. Please click the link to confirm your subscription."
  }
}
```

Add to `messages/de.json`:
```json
{
  "newsletter": {
    "placeholder": "deine@email.de",
    "subscribe": "Abonnieren",
    "subscribing": "Wird abonniert...",
    "ariaLabel": "E-Mail-Adresse für Newsletter",
    "successTitle": "Überprüfe deine E-Mails!",
    "successMessage": "Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link, um dein Abonnement zu bestätigen."
  }
}
```

---

### Step 7: Integrate into PhysicsHero

**File:** `components/PhysicsHero.tsx`

Add import at the top:
```typescript
import NewsletterForm from './NewsletterForm';
```

Add the newsletter form in your content section (example placement):
```typescript
<div className={styles.content}>
  <h1 className={styles.title}>
    {/* ... existing title ... */}
  </h1>

  <p className={styles.dates}>
    {/* ... existing dates ... */}
  </p>

  <p className={styles.tagline}>
    {/* ... existing tagline ... */}
  </p>

  {/* Add newsletter form */}
  <div className={styles.newsletterWrapper}>
    <NewsletterForm />
  </div>
</div>
```

You may want to add some spacing in `PhysicsHero.module.css`:
```css
.newsletterWrapper {
  margin-top: 2rem;
  width: 100%;
  max-width: 500px;
}
```

---

## Local Testing Guide

### How to Test Locally with API Token

#### Option 1: Using Next.js Dev Server (Recommended)

**Step 1:** Create `.env.local` file (if you haven't already)
```bash
# In project root
echo "MAILERLITE_API_TOKEN=your_token_here" > .env.local
```

**Step 2:** Start the dev server
```bash
npm run dev
```

**Step 3:** Server Actions work automatically!
- Next.js dev server loads environment variables from `.env.local`
- Server Actions execute on the server side
- Your API token is never exposed to the browser

**Step 4:** Test the form
1. Navigate to your homepage
2. Scroll to the newsletter form
3. Enter a test email address
4. Click "Subscribe"
5. You should see a success message
6. Check your email inbox for the MailerLite confirmation email

#### Option 2: Using a Test Email Address

**Recommended:** Create a test group in MailerLite for development:

1. Log into MailerLite
2. Navigate to **Subscribers** → **Groups**
3. Create a new group called `Test - Development`
4. Get the group ID from the URL when viewing the group

Then modify your Server Action temporarily to use the test group:

```typescript
body: JSON.stringify({
  email,
  status: 'unconfirmed',
  groups: ['your_test_group_id'], // Add this line
}),
```

This way you can:
- ✅ Test with real MailerLite API calls
- ✅ Keep test subscribers separate from production
- ✅ Easily delete test data later

#### What NOT to Do

❌ **DON'T** expose the API token in client-side code:
```typescript
// WRONG - Never do this!
const MAILERLITE_API_TOKEN = 'eyJ0eXAi...'; // Hardcoded
process.env.NEXT_PUBLIC_MAILERLITE_API_TOKEN // Client-side accessible
```

❌ **DON'T** commit `.env.local` to git:
```bash
# WRONG - Never do this!
git add .env.local
git commit -m "Add env file"
```

❌ **DON'T** test in production without proper testing locally first

### Debugging Tips

**Check if environment variable is loaded:**

Add a temporary console.log in your Server Action:
```typescript
export async function subscribeToNewsletter(...) {
  const apiToken = process.env.MAILERLITE_API_TOKEN;
  console.log('API Token exists:', !!apiToken); // Should print: true
  console.log('API Token length:', apiToken?.length); // Should print: ~200+

  // ... rest of code
}
```

**Important:** Remove these logs before deploying to production!

**Check Server Action is being called:**

Look at your terminal where `npm run dev` is running. You should see:
```
API Token exists: true
API Token length: 234
```

If you see `false` or `undefined`:
1. Check `.env.local` file exists in project root
2. Check the variable name is exactly `MAILERLITE_API_TOKEN`
3. Restart dev server (`Ctrl+C`, then `npm run dev` again)

---

## Production Deployment

### Step 1: Configure Netlify Environment Variables

1. Go to Netlify dashboard: https://app.netlify.com
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Click **"Add a variable"**

**Variable to add:**
```
Key: MAILERLITE_API_TOKEN
Value: [paste your actual API token]
Scopes: All scopes (or at minimum: "Builds" and "Functions")
```

5. Click **"Create variable"**

### Step 2: Deploy

#### Option A: Push to Git (Automatic Deployment)
```bash
git add .
git commit -m "Add newsletter subscription with double opt-in"
git push origin main
```

Netlify will automatically:
- Detect the push
- Build your site
- Deploy with the environment variables

#### Option B: Manual Deploy
```bash
npm run build
# Manually deploy via Netlify CLI or dashboard
```

### Step 3: Verify Production

1. Visit your production site
2. Test the newsletter form with a real email
3. Check that the confirmation email arrives
4. Confirm the subscription
5. Verify the welcome email arrives

**Important:** Test with an email address you control, not a fake one!

---

## Testing Checklist

### Local Testing

- [ ] `.env.local` file created and contains API token
- [ ] Dev server started with `npm run dev`
- [ ] Can access the homepage with newsletter form
- [ ] Form validation works (try invalid email)
- [ ] Form submission shows loading state
- [ ] Success message appears after submission
- [ ] Confirmation email arrives in inbox
- [ ] Confirmation link works
- [ ] Welcome email arrives after confirmation
- [ ] Error handling works (try submitting twice quickly to trigger rate limit)

### Production Testing

- [ ] Environment variable configured in Netlify
- [ ] Site deployed successfully
- [ ] Newsletter form appears on production site
- [ ] Form submission works on production
- [ ] Confirmation email arrives
- [ ] Email links point to correct domain
- [ ] Mobile responsive (test on phone)
- [ ] Works in different browsers (Chrome, Firefox, Safari)
- [ ] Works with different email providers (Gmail, Outlook, etc.)

### MailerLite Configuration

- [ ] Double opt-in enabled in MailerLite settings
- [ ] Confirmation email template configured
- [ ] Welcome email sequence set up (optional but recommended)
- [ ] Unsubscribe link present in all emails
- [ ] From name and email configured correctly

### GDPR Compliance (See existing guide)

- [ ] Privacy Policy page exists and is linked
- [ ] Consent is clearly explained
- [ ] Unsubscribe process tested
- [ ] Data Processing Agreement with MailerLite reviewed

---

## Troubleshooting

### Issue: "Configuration error" message

**Cause:** `MAILERLITE_API_TOKEN` environment variable not found

**Solutions:**
- **Local:** Check `.env.local` exists and has correct variable name
- **Local:** Restart dev server after creating `.env.local`
- **Production:** Check Netlify environment variables are set
- **Production:** Trigger a new deployment after adding environment variables

---

### Issue: Form submits but no email received

**Possible causes:**

1. **Double opt-in not enabled in MailerLite**
   - Solution: Settings → Forms & Popups → Enable double opt-in for API

2. **Email went to spam**
   - Solution: Check spam folder, add MailerLite domain to safe senders

3. **API token is invalid**
   - Solution: Generate new token in MailerLite and update environment variables

4. **MailerLite rate limit hit**
   - Solution: Wait 60 seconds and try again (120 requests/minute limit)

5. **Network error**
   - Solution: Check MailerLite API status page

---

### Issue: "Invalid email address" error

**Possible causes:**

1. **Email format is incorrect**
   - Solution: Check Zod validation schema allows the email format

2. **Email is too long**
   - Solution: Current limit is 80 characters (reasonable)

3. **MailerLite rejected the email**
   - Solution: Check MailerLite logs for the specific rejection reason

---

### Issue: Styling doesn't match corporate design

**Solution:**

Check that you're using the correct corporate colors in `NewsletterForm.module.css`:

- Background: `#e9eef9`
- Primary text: `#6a453a`
- Accent color (buttons): `#5289b5`
- Font: `'Sukhumvit Set'`

---

### Issue: Form doesn't appear on the page

**Possible causes:**

1. **Component not imported**
   - Solution: Check PhysicsHero.tsx has `import NewsletterForm from './NewsletterForm';`

2. **CSS issues**
   - Solution: Check browser console for CSS errors

3. **Build error**
   - Solution: Check terminal for TypeScript or build errors

---

### Issue: "Too many requests" error

**Cause:** MailerLite has a 120 requests/minute rate limit

**Solutions:**
- Wait 60 seconds before trying again
- If testing frequently, use a test group to avoid hitting production limits
- Consider implementing client-side rate limiting (disable button for 30s after submission)

---

## Performance Considerations

### Server Actions vs. API Routes

**Why we chose Server Actions:**

| Feature | Server Actions | API Routes (old approach) |
|---------|----------------|---------------------------|
| CSRF Protection | ✅ Built-in | ❌ Manual implementation |
| Type Safety | ✅ End-to-end | ⚠️ Separate types |
| Bundle Size | ✅ Minimal | ⚠️ Additional fetch client |
| Form State | ✅ `useActionState` hook | ❌ Manual useState |
| Progressive Enhancement | ✅ Works without JS | ❌ Requires JavaScript |
| Code Complexity | ✅ Simple | ⚠️ More boilerplate |

### Optimization Tips

1. **Email validation happens server-side** - No extra client bundle
2. **`useActionState` is built into React 19** - No extra dependencies
3. **Zod validation is tree-shakeable** - Only what you use is bundled
4. **CSS Modules are automatically optimized** - Scoped and minified

---

## Security Best Practices

### What We're Doing Right

✅ **API token stored server-side only**
- Never exposed to client (no `NEXT_PUBLIC_` prefix)
- Only accessible in Server Actions and API Routes

✅ **Input validation with Zod**
- Prevents injection attacks
- Server-side validation (never trust client)
- Clear error messages

✅ **CSRF protection via Server Actions**
- Automatic Origin header validation
- POST-only requests
- Same-origin enforcement

✅ **Rate limiting awareness**
- Handle 429 errors gracefully
- User-friendly error messages

✅ **HTTPS-only in production**
- Netlify provides automatic HTTPS
- API token encrypted in transit

### Additional Security Measures (Optional)

**1. Add Origin Validation in `next.config.js`:**

```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'yourdomain.com',
        'www.yourdomain.com',
        'localhost:3000', // For local development
      ],
    },
  },
};
```

**2. Implement Honeypot Field (Anti-Bot):**

Add hidden field to form:
```typescript
<input
  type="text"
  name="website"
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>
```

In Server Action:
```typescript
const honeypot = formData.get('website');
if (honeypot) {
  // Bot detected - pretend success but don't subscribe
  return { success: true };
}
```

**3. Add reCAPTCHA (if spam becomes an issue)**

Only if you start getting spam subscriptions. Adds friction for users.

---

## Next Steps After Implementation

### Immediate (Week 1)

1. **Set up MailerLite welcome sequence**
   - Email 1: Immediate welcome + set expectations
   - Email 2 (Day 3): Event highlights
   - Email 3 (Day 7): Community stories

2. **Configure confirmation email template**
   - Clear subject line
   - Prominent confirmation button
   - "Didn't sign up? Ignore this email" text

3. **Test end-to-end flow**
   - Subscribe with test email
   - Confirm subscription
   - Verify welcome emails arrive

### Week 2-4

4. **Set up email authentication (SPF/DKIM/DMARC)**
   - See existing guide: `docs/newsletter-setup-guide.md`
   - Critical for deliverability

5. **Write Privacy Policy**
   - Already exists at `/privacy` but may need newsletter-specific updates
   - Ensure it covers MailerLite data processing

6. **Monitor metrics**
   - Confirmation rate (should be >50%)
   - Open rate (target: 30-40%)
   - Unsubscribe rate (should be <1%)

### Ongoing

7. **Send regular newsletters**
   - Decide on cadence (1x/month recommended to start)
   - 60/30/10 content ratio (value/community/promotion)

8. **Clean subscriber list quarterly**
   - Remove hard bounces
   - Re-engage inactive subscribers

9. **Review and optimize**
   - A/B test subject lines
   - Analyze which content performs best
   - Adjust sending frequency based on engagement

---

## Additional Resources

### Documentation Links

- **Next.js Server Actions:** https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **MailerLite API Docs:** https://developers.mailerlite.com/docs/subscribers
- **Zod Documentation:** https://zod.dev/
- **React useActionState:** https://react.dev/reference/react/useActionState

### Project-Specific Docs

- **Email Authentication Guide:** `/docs/newsletter-setup-guide.md` (sections on SPF/DKIM/DMARC)
- **GDPR Compliance:** `/docs/newsletter-setup-guide.md` (comprehensive GDPR section)
- **Privacy Policy:** `/app/[locale]/privacy/page.tsx`

### Support

- **MailerLite Support:** https://www.mailerlite.com/help (24/7 chat)
- **Netlify Support:** https://docs.netlify.com/
- **Next.js Discord:** https://nextjs.org/discord

---

## Summary

**What we're building:**
- Custom newsletter subscription form in PhysicsHero component
- Server-side processing with Next.js Server Actions
- MailerLite integration with double opt-in
- Full internationalization (English + German)
- GDPR-compliant data handling

**Timeline:**
- **Implementation:** 4-6 hours
- **Testing:** 2 hours
- **MailerLite setup:** 2 hours
- **Total:** ~8-10 hours

**Key advantages:**
- ✅ Secure (API token never exposed)
- ✅ Fast (minimal JavaScript)
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Mobile-responsive
- ✅ GDPR-compliant
- ✅ Easy to maintain

**Ready to start?**

1. Get your MailerLite API token
2. Create `.env.local` file
3. Install dependencies (`npm install zod`)
4. Follow implementation steps above
5. Test locally
6. Deploy to production

Good luck! 🎉
