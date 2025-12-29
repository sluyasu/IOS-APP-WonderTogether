# Hosting Privacy Policy & Terms of Service

These HTML files need to be hosted publicly for App Store submission.

## Option 1: GitHub Pages (Free & Easy)

1. Create a new GitHub repository (e.g., `wondertogether-legal`)
2. Upload `privacy-policy.html` and `terms-of-service.html`
3. Enable GitHub Pages in repository settings
4. Your URLs will be:
   - Privacy Policy: `https://[username].github.io/wondertogether-legal/privacy-policy.html`
   - Terms: `https://[username].github.io/wondertogether-legal/terms-of-service.html`

## Option 2: Your Own Domain

If you have `wondertogether.app`:
1. Upload files to web hosting
2. URLs:
   - `https://wondertogether.app/privacy-policy.html`
   - `https://wondertogether.app/terms-of-service.html`

## Option 3: Netlify Drop (Free)

1. Go to https://app.netlify.com/drop
2. Drag & drop the folder containing these files
3. Get instant hosting with URLs

## After Hosting

Update the URLs in two places:

### 1. App Settings (app/(app)/settings/index.tsx)

Replace the TODOs around line 165:
```typescript
// Current (placeholder):
Alert.alert('Privacy Policy', 'Privacy policy will be available at: https://wondertogether.app/privacy-policy');

// Update to:
import * as WebBrowser from 'expo-web-browser';
// ...
await WebBrowser.openBrowserAsync('https://your-actual-url.com/privacy-policy.html');
```

### 2. App Store Connect

When submitting your app:
- Add Privacy Policy URL in App Store Connect
- Add Terms of Service URL (optional but recommended)

## Important Notes

- ⚠️ The email addresses in the HTML (privacy@wondertogether.app, support@wondertogether.app) should be replaced with real email addresses
- ⚠️ Review the privacy policy to ensure all data practices are accurately described
- ⚠️ Update the "Last Updated" date when making changes
- ⚠️ The "[Your Jurisdiction]" in Terms of Service should be replaced with your actual jurisdiction

## Opening Links in App

Install expo-web-browser:
```bash
npm install expo-web-browser
```

Then update settings/index.tsx to open links in browser instead of Alert.
