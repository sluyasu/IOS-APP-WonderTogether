# Pre-Submission Checklist

## ✅ App Configuration

### Bundle ID & Version
- [ ] Bundle ID is final: `com.wondertogether.app`
- [ ] Version number: `1.0.0`
- [ ] Build number: `1`
- [ ] App name is correct: "WonderTogether"

### Icons & Assets
- [ ] App icon is set (1024x1024 for iOS)
- [ ] No placeholder icons
- [ ] Splash screen configured
- [ ] All icon sizes generated

### Permissions
- [ ] All permission descriptions are user-friendly
- [ ] Camera permission description set
- [ ] Photos permission description set
- [ ] Location permission description set
- [ ] Permissions work correctly on device

## ✅ Legal & Compliance

### Privacy & Terms
- [ ] Privacy policy is hosted online
- [ ] Terms of service is hosted online
- [ ] Privacy policy URL added to app.json
- [ ] Privacy policy link works in app
- [ ] Support email is valid and monitored
- [ ] Privacy policy accurately describes data usage

### App Store Connect
- [ ] Privacy policy URL ready for App Store Connect
- [ ] Support URL ready
- [ ] Marketing URL ready (optional)

## ✅ Content & Functionality

### Core Features Work
- [ ] App launches without crashing
- [ ] Sign up flow works
- [ ] Login flow works
- [ ] Group creation works
- [ ] Trip creation works
- [ ] Photo upload works
- [ ] Map displays correctly
- [ ] All main screens are accessible

### Data & Backend
- [ ] Supabase connection works
- [ ] Environment variables are set
- [ ] Database schema is finalized
- [ ] Row Level Security policies are correct
- [ ] Storage buckets are configured

### UI/UX Polish
- [ ] No "Coming Soon" features visible (or marked clearly)
- [ ] No Lorem Ipsum text
- [ ] No debug console visible
- [ ] All buttons work
- [ ] Navigation flows logically
- [ ] Loading states are handled
- [ ] Error states are handled gracefully

## ✅ Testing

### Device Testing
- [ ] Tested on real iOS device
- [ ] Tested on real Android device (if submitting)
- [ ] Tested on different screen sizes
- [ ] Tested with slow internet
- [ ] Tested offline behavior
- [ ] Tested permission denial scenarios

### User Flows
- [ ] New user can sign up
- [ ] User can create first group
- [ ] User can join a group via invite code
- [ ] User can create a trip
- [ ] User can upload photos
- [ ] User can view map
- [ ] User can see statistics

### Edge Cases
- [ ] App handles no internet connection
- [ ] App handles denied permissions
- [ ] App handles empty states
- [ ] App handles large datasets (100+ photos)
- [ ] App doesn't crash with invalid data

## ✅ App Store Materials

### Listing Text
- [ ] App name decided
- [ ] Short description written
- [ ] Full description written
- [ ] Keywords selected (under 100 chars)
- [ ] Category chosen
- [ ] Age rating determined
- [ ] "What's New" text written

### Screenshots
- [ ] 3+ iPhone 6.7" screenshots (1290x2796)
- [ ] Screenshots show polished content
- [ ] Screenshots showcase main features
- [ ] Screenshots have realistic data
- [ ] Optional: iPad screenshots if supporting
- [ ] Optional: App preview video created

### Metadata
- [ ] Copyright text ready
- [ ] Support email set up
- [ ] Privacy policy URL confirmed
- [ ] Demo account created (optional)

## ✅ Build Process

### EAS Build
- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Project configured with `eas build:configure`
- [ ] Preview build created and tested
- [ ] Production build successful

### iOS Specific
- [ ] Apple Developer account active ($99/year)
- [ ] Development certificates generated
- [ ] Distribution certificates generated
- [ ] App ID registered in Apple Developer Portal
- [ ] TestFlight tested (optional but recommended)

### Android Specific
- [ ] App signing key generated
- [ ] Bundle/APK built successfully
- [ ] Tested on Android device

## ✅ Final Checks

### Pre-Upload
- [ ] All placeholder text removed
- [ ] All debug code removed
- [ ] All console.logs reviewed (errors kept, debug removed)
- [ ] Environment variables are production-ready
- [ ] API keys are valid
- [ ] No hardcoded test data

### Documentation
- [ ] README.md is complete
- [ ] Privacy policy is accurate
- [ ] Terms of service reviewed
- [ ] Support documentation ready

### Team Preparation
- [ ] Know how to respond to user reviews
- [ ] Support email monitoring set up
- [ ] Plan for post-launch updates
- [ ] Bug reporting system ready

## 🚀 Ready to Submit

When all above are checked:

1. **Create production build:**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

2. **Upload to App Store Connect** (iOS)
3. **Upload to Google Play Console** (Android)
4. **Fill in all required fields**
5. **Upload screenshots**
6. **Submit for review**

## ⏱️ Timeline

- **iOS Review:** Typically 1-3 days
- **Android Review:** Typically 2-5 days
- **Rejections:** Don't panic, fix and resubmit

## 📞 Support

If you get rejected:
- Read rejection reason carefully
- Fix the specific issue
- Respond in App Store Connect
- Resubmit promptly

---

**Good luck with your submission! 🎉**
