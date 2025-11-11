# Newsletter Setup Guide for Swing Dance Exchange

## Table of Contents
1. [Email Authentication Requirements (SPF, DKIM, DMARC)](#email-authentication-requirements)
2. [GDPR Compliance for Swiss Organizations](#gdpr-compliance-for-swiss-organizations)
3. [Implementation Recommendations](#implementation-recommendations)

---

## Email Authentication Requirements (SPF, DKIM, DMARC)

### What "Mandatory" Really Means

When we say email authentication is "mandatory," we mean:

**As of February 2024, Gmail and Yahoo Mail REQUIRE SPF, DKIM, and DMARC authentication for all bulk senders.** This isn't a recommendation—it's an enforcement policy.

#### What Happens If You Don't Set Them Up?

| Scenario | Consequence |
|----------|-------------|
| **No SPF/DKIM/DMARC** | Emails rejected outright or sent to spam folder |
| **SPF only** | Better than nothing, but still likely flagged as suspicious |
| **SPF + DKIM only** | Improved delivery, but Gmail/Yahoo still prefer DMARC |
| **All three configured** | ✅ Best deliverability, professional sender reputation |

**Bottom line**: Without proper authentication, your newsletter emails will likely never reach subscribers' inboxes—they'll be automatically filtered to spam or rejected entirely.

### The Three Authentication Protocols Explained

#### 1. SPF (Sender Policy Framework)

**What it does**: Tells receiving mail servers which IP addresses are authorized to send email on behalf of your domain.

**How it works**: You add a TXT record to your domain's DNS that lists authorized mail servers.

**Example SPF Record**:
```
v=spf1 include:_spf.mailerlite.com ~all
```

**Translation**: "Only MailerLite's servers are authorized to send email from my domain. Treat anything else as suspicious."

**Why it matters**: Prevents spammers from forging emails that appear to come from your domain.

**Setup difficulty**: ⭐ Easy (single DNS TXT record)

---

#### 2. DKIM (DomainKeys Identified Mail)

**What it does**: Adds a digital signature to your emails that proves they haven't been tampered with in transit.

**How it works**:
1. Your newsletter service signs outgoing emails with a private key
2. You publish the corresponding public key in your DNS
3. Receiving servers verify the signature matches

**Example DKIM Record**:
```
Host: ml._domainkey.yourdomain.com
Type: CNAME
Value: ml._domainkey.mailerlite.com
```

**Why it matters**: Proves that the email genuinely came from your authorized sender and wasn't modified.

**Setup difficulty**: ⭐⭐ Moderate (usually 2 CNAME records)

---

#### 3. DMARC (Domain-based Message Authentication)

**What it does**: Tells receiving mail servers what to do if SPF or DKIM checks fail.

**How it works**: You set a policy that instructs mail servers how to handle unauthenticated emails:
- `p=none` - Just monitor and report, don't take action (start here)
- `p=quarantine` - Send suspicious emails to spam folder
- `p=reject` - Reject suspicious emails outright (strongest protection)

**Example DMARC Record**:
```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Translation**: "If SPF/DKIM fail, don't take action yet—just send me reports so I can monitor."

**Why it matters**: Completes the authentication chain and gives you control over your domain's email reputation.

**Setup difficulty**: ⭐⭐ Moderate (single DNS TXT record)

**Best practice progression**:
1. **Week 1**: Deploy with `p=none` (monitor only)
2. **Month 2-3**: Review DMARC reports, ensure legitimate emails pass
3. **Month 4+**: Upgrade to `p=quarantine` once confident
4. **Month 6+**: Consider `p=reject` for maximum protection

---

### Who Enforces This?

**Major email providers requiring authentication as of 2024:**
- ✅ **Gmail / Google Workspace** - Strict enforcement
- ✅ **Yahoo Mail** - Strict enforcement
- ✅ **Microsoft Outlook / Hotmail** - Recommended, increasingly enforced
- ✅ **Apple iCloud Mail** - Recommended
- ✅ **ProtonMail** - Checks authentication
- ⚠️ **Smaller providers** - Many follow Google/Yahoo's lead

**Important**: Google and Yahoo together represent a significant portion of email users worldwide. If you can't deliver to Gmail, you're missing a huge portion of your audience.

---

### Do Newsletter Services Handle This Automatically?

**Partial answer**: Yes and no.

#### What Newsletter Services Provide:
- ✅ The DNS records you need to add
- ✅ Instructions on where to add them
- ✅ Verification tools to check if setup is correct
- ✅ Their own infrastructure to sign and send emails

#### What YOU Must Do:
- ❌ Access your domain registrar's DNS settings
- ❌ Add the provided records (TXT, CNAME)
- ❌ Wait 24-72 hours for DNS propagation
- ❌ Verify setup using their tools

**Example workflow with MailerLite:**

1. **MailerLite provides records like**:
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:_spf.mailerlite.com ~all

   Type: CNAME
   Host: ml._domainkey
   Value: ml._domainkey.mailerlite.com

   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

2. **You log into your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.)

3. **You add these records** to your DNS settings

4. **You wait** for DNS propagation (24-72 hours typically)

5. **You verify** in MailerLite that authentication passes

**The service can't do this for you** because they don't have access to your domain's DNS settings—only you (or your domain administrator) can modify those.

---

### Testing Your Setup

After adding DNS records, verify they're working:

#### 1. **MXToolbox** (https://mxtoolbox.com/)
- Check SPF: `https://mxtoolbox.com/spf.aspx`
- Check DMARC: `https://mxtoolbox.com/dmarc.aspx`
- Check DKIM: `https://mxtoolbox.com/dkim.aspx`

#### 2. **Mail Tester** (https://mail-tester.com/)
- Send a test email to the address they provide
- Get a deliverability score (aim for 10/10)
- See detailed authentication check results

#### 3. **Send Test Email to Gmail**
- Send newsletter test to your Gmail account
- Open the email
- Click three dots → "Show original"
- Look for:
  ```
  SPF: PASS
  DKIM: PASS
  DMARC: PASS
  ```

#### 4. **Newsletter Service Verification**
Most services (MailerLite, Kit, etc.) have built-in verification tools that check if your DNS records are correctly configured.

---

### Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| "SPF record not found" | DNS not propagated or record incorrect | Wait 24-72 hours; double-check record syntax |
| "DKIM signature failed" | Wrong CNAME value or not propagated | Verify CNAME points to service's key; wait for propagation |
| "DMARC policy not found" | No TXT record at `_dmarc` subdomain | Add DMARC TXT record; start with `p=none` |
| "Multiple SPF records" | More than one SPF TXT record exists | Combine into single record using `include:` |
| "Too many DNS lookups" | SPF record too complex | Consolidate includes; use flattening tools |

---

### Timeline Expectations

**DNS Propagation:**
- **Typical**: 1-4 hours
- **Maximum**: 48-72 hours
- **Global propagation**: Up to 72 hours

**Recommendation**: Set up authentication at least 1 week before sending your first newsletter to allow time for:
1. Adding records
2. Waiting for propagation
3. Verifying setup
4. Troubleshooting any issues
5. Testing with real emails

---

### Can You Skip This?

**Technically yes, but practically no.**

**What happens if you skip authentication:**
1. **Short term**: Some emails might get through initially
2. **Medium term**: Increasing number marked as spam
3. **Long term**: Domain reputation tanks, deliverability drops below 50%
4. **Worst case**: Blacklisted by major providers, emails rejected outright

**Effort vs. Impact:**
- **Setup time**: 1-2 hours (mostly waiting for DNS)
- **Technical difficulty**: Low to moderate (copy-paste DNS records)
- **Impact on deliverability**: Massive (potentially 40-60% improvement)

**Verdict**: The 1-2 hours investment is absolutely worth it to ensure your newsletters actually reach subscribers.

---

## GDPR Compliance for Swiss Organizations

### Does GDPR Apply to You?

**Short answer: YES, if you have EU/EEA subscribers.**

The GDPR applies based on **where your subscribers are located**, not where your organization is based.

#### GDPR Applicability Decision Tree

```
┌─ Do you collect email addresses from people? ──► NO ──► GDPR doesn't apply
│
└─► YES
    │
    ├─ Are ANY subscribers located in EU/EEA? ──► NO ──► GDPR doesn't apply*
    │                                                      (*but Swiss DPA likely applies)
    └─► YES
        │
        └─► GDPR APPLIES (regardless of your organization's size or location)
```

**Key principle**: GDPR follows the **data subject** (the person), not the **data controller** (your organization).

---

### Switzerland and GDPR

Switzerland is NOT in the EU, but:

#### **Swiss Federal Act on Data Protection (FADP/revDPA)**
- Switzerland has its own data protection law (revised FADP, effective Sept 2023)
- **Similar to GDPR** in most requirements
- **Differences**: Some stricter requirements (e.g., more limited legal bases for processing)

#### **EU-Swiss Adequacy Decision**
- The EU recognizes Switzerland as having "adequate" data protection
- This means data can flow freely between EU and Switzerland
- Swiss organizations processing EU data must still comply with GDPR

#### **Practical Impact for Your Event**

Your event is in Zürich (Switzerland), with attendees across Europe:

| Attendee Location | Applicable Law | What This Means |
|-------------------|----------------|-----------------|
| **Switzerland** | Swiss FADP | Must comply with Swiss data protection law |
| **Germany, France, Austria, etc.** | GDPR | Must comply with GDPR |
| **UK** | UK GDPR | Must comply with UK GDPR (nearly identical to GDPR) |
| **Norway, Iceland** | GDPR (via EEA) | Must comply with GDPR |
| **Outside EU/EEA/CH** | Varies | May have other requirements (e.g., CCPA in California) |

**Bottom line**: Since you'll have EU subscribers, **you must comply with GDPR**, even though you're a Swiss organization.

---

### Small Organization Exception?

**IMPORTANT: There is NO small organization exception for GDPR.**

GDPR applies to:
- ✅ Multinational corporations
- ✅ Small businesses
- ✅ Non-profits and associations (Vereine)
- ✅ Individuals running websites
- ✅ Event organizers of any size

**The ONLY size-related exemption:**
- Organizations with **fewer than 250 employees** have reduced record-keeping obligations
- BUT: All other GDPR requirements still apply (consent, privacy policy, data rights, etc.)

**Translation for your event**: Being a small Verein doesn't exempt you from GDPR. If you collect email addresses from EU residents, you must comply.

---

### What GDPR Requires for Newsletters

#### 1. **Lawful Basis for Processing**

You need a legal justification to collect and process email addresses. For newsletters, the most common basis is:

**Consent** (Article 6(1)(a) + Article 7)

Requirements for valid consent:
- ✅ **Freely given**: No pressure, no pre-ticked boxes
- ✅ **Specific**: Clear about what they're consenting to
- ✅ **Informed**: They know what emails they'll receive and why
- ✅ **Unambiguous**: Active opt-in required (checking box, clicking button)
- ✅ **Demonstrable**: You can prove they consented (keep records)
- ✅ **Withdrawable**: Easy to unsubscribe (as easy as subscribing)

**Bad example** ❌:
```
☑️ I agree to the Terms and Conditions, Privacy Policy,
   and to receive marketing emails
```
*Problems*: Pre-ticked, bundled consent, unclear

**Good example** ✅:
```
☐ I consent to receiving the Swing Dance Exchange newsletter
   with event updates and announcements. I can unsubscribe anytime.
   See our Privacy Policy for details.
```
*Why it works*: Unticked, specific, clear, easy to understand

---

#### 2. **Privacy Policy / Privacy Notice**

You MUST have a privacy policy that explains:

**Required elements:**
- ✅ **Identity of data controller**: Who you are (organization name, contact)
- ✅ **What data you collect**: Email address, name (if collected), IP address, timestamp
- ✅ **Why you collect it**: Purpose (sending newsletter about event)
- ✅ **Legal basis**: Consent (Article 6(1)(a))
- ✅ **How long you keep it**: Retention period (e.g., "until unsubscribe + 30 days")
- ✅ **Third parties**: Who processes data (e.g., "MailerLite processes emails on our behalf")
- ✅ **Data location**: Where data is stored (e.g., "EU data centers")
- ✅ **Data subject rights**: Right to access, rectify, erase, restrict, port, object
- ✅ **How to exercise rights**: Contact email/form for data requests
- ✅ **Right to complain**: Can file complaint with data protection authority
- ✅ **Whether required**: Is providing email mandatory? (No, for newsletters)
- ✅ **Automated decision-making**: Any profiling? (Usually no for simple newsletters)

**Where to put it:**
- Dedicated `/privacy` page on website
- Link from newsletter signup form
- Link in footer of every newsletter email

**Swiss-specific addition:**
Include information about Swiss Federal Data Protection Authority (FDPIC) as the supervisory authority for Swiss aspects.

---

#### 3. **Consent Mechanism on Signup Form**

**Required elements:**

```html
<form>
  <!-- Email field -->
  <label for="email">Email Address *</label>
  <input type="email" id="email" name="email" required />

  <!-- Consent checkbox (MUST be unticked by default) -->
  <input type="checkbox" id="consent" name="consent" required />
  <label for="consent">
    I consent to receiving the Queer Swing Dance Exchange newsletter
    with event updates, announcements, and artist information.
    I understand I can unsubscribe at any time.
    Read our <a href="/privacy">Privacy Policy</a>.*
  </label>

  <!-- Optional: Additional marketing consent (separate checkbox) -->
  <input type="checkbox" id="marketing" name="marketing" />
  <label for="marketing">
    I also consent to receiving occasional promotional emails about
    special offers and partner events (optional)
  </label>

  <button type="submit">Subscribe</button>

  <!-- Privacy notice -->
  <p>
    We process your data in accordance with our
    <a href="/privacy">Privacy Policy</a>.
    Your data will be processed by MailerLite (EU data centers)
    to send you newsletters.
  </p>
</form>
```

**Key requirements:**
- Checkbox MUST be unchecked by default (no pre-ticked boxes)
- Separate checkbox for newsletter vs. other marketing (granular consent)
- Clear language about what they're signing up for
- Link to privacy policy
- Easy to understand (no legal jargon)

---

#### 4. **Double Opt-In (Recommended)**

While GDPR doesn't explicitly require double opt-in, it's **highly recommended** because:

✅ **Proves consent**: Confirms the email address owner actually consented
✅ **Prevents abuse**: Someone can't sign up others without permission
✅ **Better engagement**: Only interested people confirm
✅ **Legal protection**: Strong evidence of consent if challenged
✅ **Required in some countries**: Germany strongly favors double opt-in via case law

**Double opt-in flow:**
```
1. User enters email on website
   ↓
2. Confirmation email sent: "Please confirm your subscription"
   ↓
3. User clicks confirmation link
   ↓
4. Subscription activated → Welcome email sent
```

**What to include in confirmation email:**
- Clear subject: "Confirm your subscription to [Event] newsletter"
- Prominent confirmation button/link
- Explanation of why confirmation is needed
- Note that link expires (e.g., after 7 days)
- "Didn't sign up? Ignore this email" text

---

#### 5. **Record Keeping (Demonstrable Consent)**

You must be able to **prove** that someone consented. Keep records of:

**For each subscriber:**
- ✅ **Email address**
- ✅ **Consent timestamp** (date and time)
- ✅ **IP address** (when they signed up)
- ✅ **Consent source** (which form, page, campaign)
- ✅ **Consent text** (exact wording of checkbox they agreed to)
- ✅ **Double opt-in confirmation timestamp** (if using double opt-in)
- ✅ **Unsubscribe timestamp** (when they opt out)

**How long to keep:** GDPR doesn't specify, but best practices:
- **Active subscribers**: Keep for duration of subscription
- **Unsubscribed**: Keep record for 30 days, then delete data but retain suppression (to prevent re-adding)
- **Consent records**: Keep for statute of limitations period (typically 3-5 years) to defend against complaints

**Most newsletter services** (MailerLite, Kit, etc.) automatically track this information for you.

---

#### 6. **Easy Unsubscribe**

GDPR Article 7(3): "It shall be as easy to withdraw consent as to give consent."

**Requirements:**
- ✅ **One-click unsubscribe** in every email (no login required)
- ✅ **Unsubscribe link visible** in email footer
- ✅ **Immediate processing** (within 72 hours, ideally instant)
- ✅ **No confirmation hoops** (avoid "Are you sure?" pages)
- ✅ **No reasons required** (optional to ask, but can't require)
- ✅ **Confirmation message** ("You've been unsubscribed")

**Good unsubscribe flow:**
```
1. User clicks "Unsubscribe" link in email
   ↓
2. Immediate unsubscribe (no additional clicks)
   ↓
3. Confirmation page: "You've been unsubscribed from [Event] newsletter"
   ↓
4. Optional: "Unsubscribed by mistake? Resubscribe here"
```

**Newsletter services handle this automatically** with unsubscribe links in email templates.

---

#### 7. **Data Subject Rights**

Under GDPR, subscribers have the right to:

| Right | Article | What It Means | Your Obligation |
|-------|---------|---------------|-----------------|
| **Access** | 15 | Get copy of their data | Provide data within 30 days |
| **Rectification** | 16 | Correct inaccurate data | Update within 30 days |
| **Erasure** | 17 | "Right to be forgotten" | Delete data within 30 days (unless legal obligation) |
| **Restriction** | 18 | Limit processing | Stop processing but keep data |
| **Portability** | 20 | Receive data in machine-readable format | Export in CSV/JSON within 30 days |
| **Object** | 21 | Object to processing | Stop processing unless compelling legitimate grounds |

**How to handle requests:**

1. **Provide a contact method** in privacy policy:
   ```
   To exercise your data rights, contact: privacy@yourevent.com
   ```

2. **Verify identity** (prevent unauthorized access)
   - Require request from registered email address
   - Ask security questions if needed
   - Don't share data without verification

3. **Respond within 30 days** (can extend to 60 days if complex)

4. **No fees** (unless requests are manifestly unfounded or excessive)

**For newsletters, most requests are deletion**:
- User requests deletion → Unsubscribe + delete data from service
- Most newsletter services have data export features for portability requests

---

#### 8. **Data Breach Notification**

If subscriber data is compromised (hack, accidental disclosure), you must:

**Within 72 hours of becoming aware:**
- ✅ Notify relevant supervisory authority (Swiss FDPIC + EU DPA if EU residents affected)
- ✅ Include: nature of breach, data affected, likely consequences, measures taken

**If high risk to individuals:**
- ✅ Notify affected subscribers directly
- ✅ Provide clear information about the breach
- ✅ Advise on protective measures

**Most likely scenario for newsletters**: Newsletter service (MailerLite, etc.) suffers breach
- **Their obligation**: Notify you (the data controller)
- **Your obligation**: Assess risk and notify authorities/subscribers if required

**Prevention**: Choose reputable newsletter services with strong security practices and GDPR compliance.

---

### GDPR Compliance Checklist for Your Newsletter

#### Setup Phase (Before Collecting Any Emails)

- [ ] **Write privacy policy** covering all required elements
- [ ] **Add privacy policy page** to website (`/privacy`)
- [ ] **Choose GDPR-compliant newsletter service** (MailerLite, Kit, etc.)
- [ ] **Verify service uses EU data centers** or has EU-US Data Privacy Framework certification
- [ ] **Sign Data Processing Agreement (DPA)** with newsletter service (most provide standard DPA)
- [ ] **Design signup form** with:
  - [ ] Unticked consent checkbox
  - [ ] Clear consent language
  - [ ] Link to privacy policy
  - [ ] Granular consent options (separate newsletter vs. marketing)
- [ ] **Enable double opt-in** in newsletter service settings
- [ ] **Configure confirmation email** with clear CTA
- [ ] **Test full signup flow** (form → confirmation → welcome)

#### Operational Phase (Ongoing)

- [ ] **Keep consent records** (email, timestamp, IP, source, consent text)
- [ ] **Include unsubscribe link** in every email (footer)
- [ ] **Process unsubscribes immediately** (within 72 hours)
- [ ] **Maintain suppression list** (prevent re-adding unsubscribed users)
- [ ] **Honor data subject rights requests** (within 30 days)
- [ ] **Review subscriber list quarterly** (remove invalid emails, audit consent)
- [ ] **Monitor for breaches** (if service notifies you, assess and respond)
- [ ] **Update privacy policy** if processing changes (notify subscribers if material change)
- [ ] **Document processing activities** (what data, why, how long, who has access)

#### Annual Audit

- [ ] **Review privacy policy** for accuracy
- [ ] **Audit subscriber consent records** (verify all have valid consent)
- [ ] **Check DPA with newsletter service** (still valid? Any updates?)
- [ ] **Review data retention** (delete old/unsubscribed data per policy)
- [ ] **Test data subject rights process** (can you export/delete data efficiently?)
- [ ] **Security assessment** (is newsletter service still secure/compliant?)

---

### Penalties for Non-Compliance

**GDPR fines (up to):**
- 💰 **€20 million** or **4% of global annual turnover** (whichever is higher)
- Actual fines depend on severity, intent, mitigation efforts

**Swiss FADP fines (up to):**
- 💰 **CHF 250,000** (for intentional violations)

**Practical reality for small organizations:**
- Large fines typically reserved for egregious violations by large companies
- Small organizations more likely to receive warnings first
- BUT: Even small fines (€1,000-10,000) hurt a small Verein
- Reputational damage can be worse than financial penalty

**Most common issues triggering enforcement:**
- Complaints from subscribers about spam/unauthorized emails
- Data breaches that weren't properly reported
- No privacy policy or extremely inadequate one
- Ignoring data subject rights requests
- Pre-ticked checkboxes or bundled consent

**Best protection**: Good-faith compliance with GDPR principles, even if not perfect.

---

### Supervisory Authorities

#### **For Swiss Organization (Base Location)**
- **Name**: Federal Data Protection and Information Commissioner (FDPIC)
- **German**: Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)
- **Website**: https://www.edoeb.admin.ch/
- **Role**: Enforces Swiss FADP

#### **For EU Data Subjects**
Each EU country has a data protection authority. Some likely relevant ones:

- **Germany**: Various state-level authorities (e.g., BfDI for federal)
- **Austria**: Österreichische Datenschutzbehörde (DSB)
- **France**: Commission Nationale de l'Informatique et des Libertés (CNIL)
- **Italy**: Garante per la Protezione dei Dati Personali

**Lead supervisory authority principle**: If you operate across multiple EU countries, one DPA typically takes the lead (usually where your main establishment is). For Swiss organization, this gets complex—consult lawyer if operating at scale.

**For newsletter**: Subscribers typically complain to their local DPA, who may refer to Swiss authorities or investigate directly.

---

### Practical GDPR Compliance for Small Event

**You don't need:**
- ❌ A dedicated Data Protection Officer (DPO) (only required for large-scale processing)
- ❌ Expensive legal consultations (for basic newsletter compliance)
- ❌ Complex data processing agreements beyond standard DPA with newsletter service
- ❌ Data Protection Impact Assessments (DPIA) (not required for basic newsletter)

**You DO need:**
- ✅ A clear, honest privacy policy
- ✅ Proper consent checkboxes (unticked, specific)
- ✅ Double opt-in confirmation
- ✅ Easy unsubscribe
- ✅ Ability to respond to data requests (export, delete)
- ✅ Records of consent
- ✅ GDPR-compliant newsletter service

**Time investment:**
- **Initial setup**: 4-6 hours (writing privacy policy, configuring forms, testing)
- **Ongoing**: <1 hour/month (handling occasional data requests, list cleanup)

**Cost:**
- **Privacy policy**: Can use templates (free) or generators like iubenda (~€27/year)
- **Newsletter service**: Already budgeted (MailerLite, etc.)
- **Legal review**: Optional but recommended (€200-500 one-time for policy review)

**Recommendation**: Start with good-faith compliance using templates and best practices. As event grows, consider legal review of privacy practices.

---

### Resources for GDPR Compliance

#### **Official Resources**
- **GDPR full text**: https://gdpr-info.eu/
- **European Commission GDPR page**: https://ec.europa.eu/info/law/law-topic/data-protection_en
- **Swiss FDPIC guidance**: https://www.edoeb.admin.ch/

#### **Privacy Policy Generators**
- **iubenda**: https://www.iubenda.com/ (~€27/year, good templates)
- **TermsFeed**: https://www.termsfeed.com/privacy-policy-generator/ (free basic version)
- **PrivacyPolicies.com**: https://www.privacypolicies.com/ (free generator)

#### **GDPR Checklists**
- **GDPR.eu checklist**: https://gdpr.eu/checklist/
- **ICO (UK) guide for small organizations**: https://ico.org.uk/for-organisations/sme-web-hub/

#### **Newsletter Service GDPR Info**
- **MailerLite GDPR**: https://www.mailerlite.com/gdpr-compliance
- **Kit GDPR**: https://help.kit.com/en/articles/gdpr
- **Buttondown GDPR**: https://buttondown.email/features/privacy

#### **Swiss-Specific Resources**
- **Swiss Data Protection Act (FADP)**: https://www.admin.ch/gov/en/start/documentation/media-releases.msg-id-85925.html
- **FDPIC Guide for SMEs**: https://www.edoeb.admin.ch/edoeb/en/home/data-protection/grundlagen/guides.html

---

## Implementation Recommendations

### Recommended Setup: MailerLite + Next.js + Netlify

Based on the research and your specific context, here's the recommended implementation:

#### Why MailerLite?

- ✅ **Best value**: Free up to 500 subscribers, $10-60/month for up to 5,000
- ✅ **GDPR compliant**: EU data centers, DPA available, built-in compliance features
- ✅ **User-friendly**: Minimal learning curve for non-technical team members
- ✅ **Strong deliverability**: Lower spam filtering rates than competitors
- ✅ **24/7 support**: Email and live chat
- ✅ **Double opt-in**: Built-in, easy to configure
- ✅ **Good automation**: Welcome email sequences included
- ✅ **Landing pages**: Can create signup landing pages if needed
- ✅ **No surprises**: Transparent pricing, no hidden fees

#### Alternative Options

**Choose Kit (ConvertKit) if:**
- You want the generous free tier (10,000 subscribers)
- You plan to monetize through paid content/digital products
- You need advanced automation beyond basic welcome sequences

**Choose Buttondown if:**
- Privacy is paramount (minimal tracking)
- You want maximum simplicity
- Your list will stay under 1,000 subscribers (~$9/month)

**Avoid MailChimp because:**
- Reduced free tier (only 500 subscribers, down from 2,500)
- Deliverability dropped 19.63% in Q1 2025
- More expensive than MailerLite for same features
- Steeper learning curve

---

### Implementation Architecture

```
┌─────────────────┐
│   Website       │
│   (Next.js)     │
│                 │
│  ┌───────────┐  │
│  │  Signup   │  │
│  │   Form    │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │ POST /api/subscribe
         │ { email: "..." }
         ▼
┌─────────────────┐
│ Netlify Function│
│  /subscribe.ts  │
│                 │
│  - Validates    │
│  - Rate limits  │
│  - Calls API    │
└────────┬────────┘
         │ API request
         │ (API key in env var)
         ▼
┌─────────────────┐
│   MailerLite    │
│   API           │
│                 │
│  - Adds sub     │
│  - Sends conf.  │
│  - Tracks       │
└─────────────────┘
```

**Why this architecture?**
- ✅ **Security**: API keys never exposed to client
- ✅ **Flexibility**: Can switch newsletter services by changing backend only
- ✅ **Control**: Add custom validation, rate limiting, logging
- ✅ **Reliability**: Netlify Functions are free and auto-scale
- ✅ **Simple**: Minimal code, easy to maintain

---

### Implementation Steps (4-Week Timeline)

#### **Week 1: Newsletter Service Setup**

**Day 1-2: Account Creation & Configuration**
1. Sign up for MailerLite account (free tier to start)
2. Complete account setup (organization name, contact info)
3. Navigate to **Settings → Domains** → Add your domain
4. Note the DNS records provided (don't add yet, do in Week 2)

**Day 3: Email Template Design**
1. Create **confirmation email** template:
   - Subject: "Please confirm your subscription to Queer Swing Dance Exchange"
   - Body: Clear explanation + prominent "Confirm Subscription" button
   - Footer: "Didn't sign up? Ignore this email"
2. Enable **double opt-in** in MailerLite settings:
   - Settings → Forms → Enable double opt-in
   - Select your confirmation email template

**Day 4-5: Welcome Email Sequence**
Create 3-email welcome sequence:

**Email 1: Immediate Welcome** (sent upon confirmation)
```
Subject: Welcome to the Queer Swing Dance Exchange community! 🎉

Hi there!

Thanks for confirming your subscription! We're thrilled to have you join
our community of swing dance enthusiasts.

Here's what you can expect from our newsletter:
• Event updates and announcements
• Artist and performer spotlights
• Behind-the-scenes stories
• Early access to ticket sales
• Tips for attendees

Our next newsletter goes out [day of week], so keep an eye out!

In the meantime:
→ Browse our event schedule: [link]
→ Meet the artists: [link]
→ Follow us on Instagram: [link]

See you on the dance floor!
The Queer Swing Dance Exchange Team

P.S. Want to get involved? We're always looking for volunteers! Reply to
this email to learn more.

---
Update your preferences: [link]
Unsubscribe: [link]
```

**Email 2: Value + Engagement** (Day 3 after confirmation)
```
Subject: What to expect at Queer Swing Dance Exchange 2026

Hi [Name],

Now that you're part of our community, we wanted to give you a sneak peek
at what makes Queer Swing Dance Exchange special...

[Content: Event highlights, what makes it unique, testimonials]

Early Bird Alert: Tickets go on sale [date]!
Newsletter subscribers get 24-hour early access.

Mark your calendar: [date & time]

[CTA Button: Set a Reminder]

Questions about the event? Just reply—we read every email!

Cheers,
[Team Name]
```

**Email 3: Community** (Day 7 after confirmation)
```
Subject: Stories from our dance floor

Hi [Name],

We asked past attendees what made Queer Swing Dance Exchange memorable.
Here's what they said...

[Content: Testimonials, photos from previous events, community stories]

Want to be part of the story? Get your tickets when they launch on [date].

[CTA: Learn More About the Event]
```

**Day 6-7: Testing**
1. Subscribe using test email address
2. Verify confirmation email arrives and looks good on mobile
3. Click confirmation link
4. Verify welcome sequence triggers correctly
5. Test unsubscribe flow
6. Check emails in Gmail, Outlook, Apple Mail

---

#### **Week 2: DNS & Email Authentication**

**Day 1: Gather DNS Records**

From MailerLite Settings → Domains, copy:

1. **SPF Record**
   ```
   Type: TXT
   Host: @ (or your domain)
   Value: v=spf1 include:_spf.mailerlite.com ~all
   ```
   *Note*: If you already have an SPF record, add `include:_spf.mailerlite.com` to the existing record. Don't create duplicate SPF records.

2. **DKIM Records** (usually 2 CNAME records)
   ```
   Type: CNAME
   Host: ml._domainkey
   Value: ml._domainkey.mailerlite.com

   Type: CNAME
   Host: ml2._domainkey
   Value: ml2._domainkey.mailerlite.com
   ```

3. **DMARC Record** (create if you don't have one)
   ```
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

**Day 2: Add DNS Records**

1. Log into your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
2. Navigate to DNS settings for your domain
3. Add each record exactly as provided
4. Save changes

**Common registrar-specific notes:**
- **Cloudflare**: Set proxy status to "DNS only" (gray cloud) for CNAME records
- **GoDaddy**: Use `@` for root domain in Host field
- **Namecheap**: Leave Host blank for `@` records

**Day 3-5: Wait for DNS Propagation**

- Typical propagation: 1-4 hours
- Maximum: 48-72 hours
- Check progress: https://www.whatsmydns.net/

**Day 6: Verify Authentication**

1. **MailerLite verification**:
   - Return to Settings → Domains in MailerLite
   - Click "Verify" button
   - Should show green checkmarks for SPF, DKIM, DMARC

2. **MXToolbox verification**:
   - SPF: https://mxtoolbox.com/spf.aspx (enter your domain)
   - DMARC: https://mxtoolbox.com/dmarc.aspx
   - Look for "pass" or "valid" results

3. **Send test email**:
   - Send test newsletter to your Gmail
   - Open email → three dots → "Show original"
   - Verify:
     ```
     SPF: PASS
     DKIM: PASS
     DMARC: PASS
     ```

**Day 7: Troubleshooting (if needed)**

Common issues and fixes in the DNS/Authentication section above.

---

#### **Week 3: Website Integration**

**Day 1-2: Create Netlify Function**

Create file: `/netlify/functions/subscribe.ts`

```typescript
import type { Handler } from '@netlify/functions';

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { email, consent } = JSON.parse(event.body || '{}');

    // Validate email
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Please provide a valid email address'
        }),
      };
    }

    // Validate consent
    if (!consent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Please confirm your consent to receive newsletters'
        }),
      };
    }

    // Call MailerLite API
    const mailerliteResponse = await fetch(
      'https://connect.mailerlite.com/api/subscribers',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
        },
        body: JSON.stringify({
          email: email,
          groups: [process.env.MAILERLITE_GROUP_ID], // Optional: assign to group
          fields: {
            // Optional: track consent details
            signup_source: 'website_footer',
            consent_timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    // Handle MailerLite errors
    if (!mailerliteResponse.ok) {
      const errorData = await mailerliteResponse.json();

      // Check if already subscribed
      if (errorData.message?.includes('already exists')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'You are already subscribed!',
          }),
        };
      }

      console.error('MailerLite API error:', errorData);
      throw new Error('Newsletter service error');
    }

    // Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Success! Please check your email to confirm your subscription.',
      }),
    };
  } catch (error) {
    console.error('Subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Something went wrong. Please try again later.',
      }),
    };
  }
};
```

**Day 3: Add Environment Variables to Netlify**

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add variables:
   ```
   MAILERLITE_API_KEY=your_api_key_here
   MAILERLITE_GROUP_ID=your_group_id_here (optional)
   ```
3. Set scope to **Functions** only (security best practice)
4. Mark as "Contains secret value" for additional protection

**To get these values:**
- **API Key**: MailerLite → Settings → Integrations → Developer API → Create new token
- **Group ID**: MailerLite → Subscribers → Groups → Click group → URL contains ID

**Day 4-5: Create Newsletter Signup Component**

Create file: `/components/NewsletterSignup.tsx`

```typescript
'use client';

import { useState, FormEvent } from 'react';
import styles from './NewsletterSignup.module.css';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, consent }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail(''); // Clear form
        setConsent(false);
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className={styles.newsletter}>
      <h3>Stay Updated</h3>
      <p>Get event updates, artist announcements, and early access to tickets.</p>

      {status === 'success' ? (
        <div className={styles.successMessage} role="alert">
          <p>✓ {message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="newsletter-email" className={styles.visuallyHidden}>
              Email Address
            </label>
            <input
              type="email"
              id="newsletter-email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              aria-required="true"
              aria-invalid={status === 'error'}
              className={styles.emailInput}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !consent}
              className={styles.submitButton}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          <div className={styles.consentGroup}>
            <input
              type="checkbox"
              id="newsletter-consent"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              disabled={status === 'loading'}
              aria-required="true"
            />
            <label htmlFor="newsletter-consent" className={styles.consentLabel}>
              I consent to receiving the Queer Swing Dance Exchange newsletter
              with event updates and announcements. I can unsubscribe anytime.
              See our <a href="/privacy">Privacy Policy</a>.*
            </label>
          </div>

          {status === 'error' && (
            <div className={styles.errorMessage} role="alert">
              <p>{message}</p>
            </div>
          )}

          <p className={styles.disclaimer}>
            We respect your privacy. Read our{' '}
            <a href="/privacy">Privacy Policy</a> for details.
          </p>
        </form>
      )}
    </div>
  );
}
```

**Day 5: Create Styles**

Create file: `/components/NewsletterSignup.module.css`

```css
.newsletter {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}

.newsletter h3 {
  margin-top: 0;
  color: #3d3325;
}

.newsletter p {
  color: #3d3325;
  margin-bottom: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inputGroup {
  display: flex;
  gap: 0.5rem;
}

.emailInput {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.emailInput:focus {
  outline: none;
  border-color: #3d3325;
}

.emailInput:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.submitButton {
  padding: 0.75rem 1.5rem;
  background: #3d3325;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.submitButton:hover:not(:disabled) {
  background: #2a241a;
}

.submitButton:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.consentGroup {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.consentGroup input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
}

.consentLabel {
  font-size: 0.9rem;
  color: #3d3325;
  line-height: 1.5;
}

.consentLabel a {
  color: #3d3325;
  text-decoration: underline;
}

.consentLabel a:hover {
  text-decoration: none;
}

.disclaimer {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.disclaimer a {
  color: #3d3325;
  text-decoration: underline;
}

.successMessage {
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  color: #155724;
}

.successMessage p {
  margin: 0;
  color: #155724;
}

.errorMessage {
  padding: 0.75rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
  font-size: 0.9rem;
}

.errorMessage p {
  margin: 0;
  color: #721c24;
}

.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .inputGroup {
    flex-direction: column;
  }

  .submitButton {
    width: 100%;
  }
}
```

**Day 6: Add to Website Footer**

Edit your layout file (likely `/app/layout.tsx`):

```typescript
import NewsletterSignup from '@/components/NewsletterSignup';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}

        {/* Add newsletter signup before footer */}
        <section style={{ padding: '4rem 1rem', background: '#e9eef9' }}>
          <NewsletterSignup />
        </section>

        {/* Footer */}
        <footer>
          {/* Your footer content */}
        </footer>
      </body>
    </html>
  );
}
```

**Day 7: Local Testing**

1. Create `.env.local` file (make sure it's in `.gitignore`):
   ```
   MAILERLITE_API_KEY=your_api_key_here
   MAILERLITE_GROUP_ID=your_group_id_here
   ```

2. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Run development server with Netlify Functions:
   ```bash
   netlify dev
   ```

4. Test signup flow:
   - Fill form with test email
   - Check consent checkbox
   - Submit
   - Verify success message
   - Check email for confirmation
   - Click confirmation link
   - Verify welcome email arrives

---

#### **Week 4: Privacy Policy & GDPR Compliance**

**Day 1-3: Write Privacy Policy**

Create file: `/app/privacy/page.tsx`

Use the privacy policy template from MailerLite's GDPR toolkit or create using iubenda. Include all required elements from the GDPR section above.

Key sections to include:
1. Who you are (organization identity)
2. What data you collect (email, IP, timestamp)
3. Why you collect it (newsletter)
4. Legal basis (consent)
5. Who processes it (MailerLite in EU data centers)
6. How long you keep it (until unsubscribe)
7. Data subject rights (access, delete, etc.)
8. How to exercise rights (contact email)
9. Right to complain to supervisory authority

**Day 4: Review GDPR Checklist**

Go through the GDPR compliance checklist in this document and ensure:
- [x] Privacy policy published at `/privacy`
- [x] Consent checkbox unticked by default
- [x] Clear consent language
- [x] Privacy policy linked from form
- [x] Double opt-in enabled
- [x] Confirmation email tested
- [x] Welcome sequence configured
- [x] Unsubscribe tested
- [x] DPA with MailerLite reviewed

**Day 5: Sign Data Processing Agreement**

1. Log into MailerLite
2. Navigate to Settings → Legal → Data Processing Agreement
3. Review DPA terms
4. Accept/sign electronically
5. Download/save copy for records

**Day 6-7: Final Testing & Launch**

**Complete end-to-end test:**
1. ✅ Visit website as new user
2. ✅ Find newsletter signup form
3. ✅ Attempt submit without consent → Error shown
4. ✅ Submit with invalid email → Error shown
5. ✅ Submit with valid email + consent → Success message
6. ✅ Receive confirmation email within 1 minute
7. ✅ Check email renders well on mobile
8. ✅ Click confirmation link
9. ✅ Redirected to confirmation page
10. ✅ Receive welcome email within 1 minute
11. ✅ Receive 2nd welcome email on Day 3 (schedule test)
12. ✅ Receive 3rd welcome email on Day 7 (schedule test)
13. ✅ Click unsubscribe in any email
14. ✅ Verify unsubscribed without requiring login
15. ✅ Check privacy policy page loads
16. ✅ Test on mobile device

**Launch checklist:**
- [ ] All tests passing
- [ ] Environment variables set in Netlify production
- [ ] DNS authentication verified (SPF/DKIM/DMARC pass)
- [ ] Privacy policy live
- [ ] Newsletter component deployed
- [ ] Welcome sequence scheduled
- [ ] Team trained on MailerLite basics
- [ ] First newsletter drafted (optional)

**Announce to community:**
- Social media post about new newsletter
- Add newsletter CTA to existing communications
- Mention in next event email (if applicable)

---

### Ongoing Maintenance

#### **Weekly (5 minutes)**
- Check MailerLite dashboard for new subscribers
- Monitor deliverability stats (should stay >85%)
- Respond to any data subject rights requests

#### **Monthly (30 minutes)**
- Review open rates (target: 30-40%)
- Review click rates (target: 3-5%)
- Check unsubscribe rate (should be <1% per email)
- Clean invalid email addresses
- Review DMARC reports (check for auth failures)

#### **Quarterly (2 hours)**
- Audit subscriber list (remove inactive bounces)
- Review and update privacy policy if needed
- Test full signup flow again (forms can break)
- A/B test subject lines for next campaign
- Review welcome sequence performance
- Security check (newsletter service still compliant?)

#### **Annually (4 hours)**
- Complete GDPR audit using checklist
- Review DPA with MailerLite (still valid?)
- Assess subscriber growth and engagement trends
- Consider upgrading/downgrading plan based on list size
- Review content strategy (what worked? what didn't?)
- Plan next year's newsletter calendar

---

### Cost Summary

#### **Year 1 Costs**

**MailerLite subscription:**
- Months 1-3 (0-500 subscribers): **$0**
- Months 4-6 (500-1,000 subscribers): **$10/month × 3 = $30**
- Months 7-9 (1,000-2,500 subscribers): **$18/month × 3 = $54**
- Months 10-12 (2,500-5,000 subscribers): **$50/month × 3 = $150**
- **Total Year 1**: ~**$234**

**Optional expenses:**
- Privacy policy generator (iubenda): **€27/year** (~$30)
- Domain (if not owned): **$12/year**
- Legal review of privacy policy: **$200-500** (one-time)

**Total Year 1 (without legal review)**: ~$276
**Total Year 1 (with legal review)**: ~$676

**Ongoing (Year 2+):**
- MailerLite: ~**$50/month** ($600/year at 5,000 subscribers)
- Privacy policy generator: **$30/year**
- **Total Year 2+**: ~$630/year

#### **ROI Calculation**

**Assumptions:**
- Ticket price: $50
- Conversion from newsletter: 2-5% (industry standard for events)
- List size: 2,500 by event time

**Conservative scenario (2% conversion):**
- 2,500 subscribers × 2% = **50 tickets**
- 50 tickets × $50 = **$2,500 revenue**
- Cost Year 1: ~$276
- **ROI: $2,224 profit** (805% return)

**Optimistic scenario (5% conversion):**
- 2,500 subscribers × 5% = **125 tickets**
- 125 tickets × $50 = **$6,250 revenue**
- **ROI: $5,974 profit** (2,164% return)

**Break-even point**: Just **6 ticket sales** ($276 ÷ $50)

**Additional value** (not quantified):
- Increased event awareness
- Community building
- Repeat attendee cultivation
- Volunteer recruitment
- Sponsor appeal (larger reach)
- Post-event survey reach

---

### Troubleshooting Common Issues

#### **Issue: Emails going to spam**

**Diagnosis:**
- Check SPF/DKIM/DMARC authentication (must all pass)
- Test email content at mail-tester.com (aim for 10/10 score)
- Check sender reputation at senderscore.org

**Solutions:**
- Ensure DNS records correctly configured (wait 72 hours)
- Avoid spam trigger words ("free," "urgent," excessive caps/exclamation marks)
- Warm up domain gradually (start with small sends, increase over weeks)
- Ask subscribers to whitelist/add to contacts
- Ensure unsubscribe link present in every email
- Monitor bounce/complaint rates (should be <1%)

---

#### **Issue: Netlify Function failing**

**Diagnosis:**
Check Netlify Functions logs:
1. Netlify dashboard → Functions tab
2. Click on `subscribe` function
3. View recent invocations and errors

**Common causes:**
- Environment variables not set or misspelled
- API key incorrect or expired
- CORS issues
- Timeout (function taking >10 seconds)
- MailerLite API changes

**Solutions:**
- Verify environment variables in Netlify settings
- Regenerate API key in MailerLite if expired
- Check CORS headers in function code
- Add error logging: `console.error(error)` to debug
- Test locally with `netlify dev`

---

#### **Issue: High unsubscribe rate (>5%)**

**Diagnosis:**
- Review recent email content (too promotional?)
- Check sending frequency (too often?)
- Analyze which emails triggered unsubscribes
- Survey unsubscribers (optional: "Why are you leaving?")

**Solutions:**
- Shift to 60/30/10 content ratio (value/community/promotion)
- Reduce frequency (try bi-weekly instead of weekly)
- Segment audience (send relevant content to interested groups)
- Set expectations in welcome email (frequency, content type)
- Offer preference center (frequency choices, topic preferences)
- A/B test subject lines and content

---

#### **Issue: Low open rate (<20%)**

**Diagnosis:**
- Compare to industry average (events: ~25-35%)
- Check send time (early morning? weekends?)
- Analyze subject lines (too generic? misleading?)
- Verify sender name recognizable
- Check for spam folder placement

**Solutions:**
- A/B test subject lines (personalization, urgency, curiosity)
- Optimize send time (try weekday mornings 8-10 AM)
- Use recognizable sender name ("Team Name" not "no-reply@...")
- Clean list (remove inactive >12 months)
- Re-engagement campaign for inactive subscribers
- Ask subscribers to whitelist sender address

---

### Next Steps

**Immediate Actions (This Week):**
1. ☐ Decide on newsletter service (recommend MailerLite)
2. ☐ Create account and explore interface
3. ☐ Draft first newsletter content (optional, can do later)

**Week 1 Actions:**
1. ☐ Set up double opt-in confirmation email
2. ☐ Create 3-email welcome sequence
3. ☐ Test full flow with personal email

**Week 2 Actions:**
1. ☐ Add DNS records for email authentication
2. ☐ Wait for propagation and verify

**Week 3 Actions:**
1. ☐ Implement Netlify Function
2. ☐ Create signup component
3. ☐ Test locally

**Week 4 Actions:**
1. ☐ Write privacy policy
2. ☐ Deploy to production
3. ☐ Final testing
4. ☐ Launch!

---

### Questions to Consider Before Starting

Before implementing, discuss with your team:

1. **Newsletter frequency**: How often will you send? (Recommend 1x/month off-season, 1x/week pre-event)

2. **Content responsibility**: Who will write newsletters? (Assign owner)

3. **Design approach**: Use MailerLite templates or custom HTML? (Recommend templates to start)

4. **Segmentation**: Will you segment subscribers (e.g., local vs. international)? (Optional, can add later)

5. **Language**: English only, or multilingual? (Affects template design)

6. **Signup locations**: Just footer, or also dedicated landing page? (Can add landing page later)

7. **Incentive**: Early bird access sufficient, or offer signup bonus (e.g., free dance tip guide)? (Optional)

8. **Moderation**: Who approves newsletter content before sending? (Establish review process)

9. **Metrics**: What success metrics matter? Open rate? Ticket conversions? (Define KPIs)

10. **Budget**: Approved for up to ~$50/month by event time? (Confirm with treasurer/team)

---

### Resources Checklist

**Bookmark these for easy reference:**

- [ ] MailerLite login: https://app.mailerlite.com/
- [ ] Netlify dashboard: https://app.netlify.com/
- [ ] Domain registrar DNS settings: [YOUR LINK]
- [ ] MXToolbox SPF check: https://mxtoolbox.com/spf.aspx
- [ ] MXToolbox DMARC check: https://mxtoolbox.com/dmarc.aspx
- [ ] Mail Tester: https://mail-tester.com/
- [ ] GDPR checklist: https://gdpr.eu/checklist/
- [ ] Swiss FDPIC: https://www.edoeb.admin.ch/
- [ ] This documentation: `/docs/newsletter-setup-guide.md`

---

**End of Implementation Guide**

For questions or issues during implementation, refer to:
1. This documentation (troubleshooting section)
2. MailerLite support: https://www.mailerlite.com/help
3. Netlify Functions docs: https://docs.netlify.com/functions/overview/
4. GDPR official text: https://gdpr-info.eu/

Good luck with your newsletter setup! 🎉
