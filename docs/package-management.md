# Queer Swing Dance Exchange Zürich

A Next.js website for the Queer Swing Dance Exchange event in Zürich.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Package Management

### Updating Packages to Latest Versions

#### Quick Method: Update All to Latest

```bash
# Update all packages to their absolute latest versions
npx npm-check-updates -u
npm install
```

#### Check What Would Be Updated (Dry Run)

```bash
# See available updates without changing anything
npx npm-check-updates
```

#### Interactive Update

```bash
# Choose which packages to update
npx npm-check-updates -i
```

#### Update Specific Package Types

```bash
# Update only dependencies (not devDependencies)
npx npm-check-updates -u --dep prod

# Update only devDependencies
npx npm-check-updates -u --dep dev
```

### Understanding npm Update Commands

#### `npm update` (Respects Version Ranges)

Updates packages within the version constraints specified in `package.json`:

```bash
npm update              # Updates all packages within their ranges
npm update next         # Updates only Next.js within its range
```

**How version ranges work:**
- `"next": "15.5.3"` → Stays at exactly 15.5.3
- `"next": "^15.5.3"` → Updates to latest 15.x (e.g., 15.9.0) but NOT 16.x
- `"next": "~15.5.3"` → Updates to latest 15.5.x (e.g., 15.5.8) but NOT 15.6.0

#### `npm install package@latest` (Ignores Version Ranges)

Installs the absolute latest version, regardless of version constraints:

```bash
# Update specific packages to latest
npm install next@latest
npm install next@latest eslint@latest

# This updates package.json to the new version
```

### Check for Outdated Packages

```bash
# See which packages have newer versions available
npm outdated
```

### Security Updates

```bash
# Update packages within version ranges (safe updates)
npm update

# For security vulnerabilities requiring major version updates
npm install package@latest
```

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules
- **Internationalization:** next-intl
- **Deployment:** Netlify

## Project Structure

```
app/
├── [locale]/              # Internationalized routes
│   ├── layout.tsx         # Root layout with locale support
│   ├── page.tsx           # Home page
│   ├── actions/           # Server actions
│   └── ...                # Other pages
components/                # React components
styles/                    # Global styles
lib/                       # Utility functions
constants/                 # Constants and configuration
public/                    # Static assets
```

## Development Notes

### Newsletter Subscription

The project includes newsletter subscription functionality:
- Production: Uses MailerLite API (requires `MAILERLITE_API_TOKEN`)
- Development: Uses `subscribeToNewsletterFake` for testing (shows browser alert)

### Internationalization

Supported languages are configured in `i18n/routing.ts`. The site uses the `[locale]` dynamic route segment to handle multiple languages.

## License

Private project for Queer Swing Dance Exchange Zürich.
