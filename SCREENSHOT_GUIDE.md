# Screenshot Requirements for App Store

## Required Sizes

### iOS App Store

#### iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, 12 Pro Max) - **REQUIRED**
- Size: 1290 x 2796 pixels
- Minimum: 3 screenshots
- Maximum: 10 screenshots

#### iPhone 6.5" (iPhone 11 Pro Max, XS Max)
- Size: 1242 x 2688 pixels
- Recommended for better coverage

#### iPhone 5.5" (Optional, for older devices)
- Size: 1242 x 2208 pixels

#### iPad Pro 12.9" (If supporting iPad)
- Size: 2048 x 2732 pixels

### Google Play Store

#### Phone Screenshots
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Size: 1080 x 1920 pixels (or higher)

## How to Take Screenshots

### Option 1: iOS Simulator (Recommended)

1. Open iOS Simulator
2. Choose device: iPhone 15 Pro Max
3. Navigate to the screen you want
4. Press `Cmd + S` to save screenshot
5. Screenshots save to Desktop

### Option 2: Real Device

1. Open app on iPhone
2. Press Side Button + Volume Up simultaneously
3. Transfer to computer
4. Resize if needed

### Option 3: Using Expo

Run the app and take screenshots programmatically:
```bash
npx expo start --ios
```

## Recommended Screenshots Order

### 1. Home/Landing Screen
**Show:** Main dashboard with upcoming trips, travel stats, and beautiful UI
**Focus:** First impression - clean, welcoming, feature-rich

### 2. Trip Planning
**Show:** Trip details screen with dates, destination, countdown
**Focus:** Easy trip organization

### 3. Photo Memories
**Show:** Photo gallery with beautiful travel pictures
**Focus:** Memory sharing and album organization

### 4. Interactive Map
**Show:** World map with pins on visited locations
**Focus:** Travel visualization

### 5. Bucket List
**Show:** List of dream destinations to visit
**Focus:** Future planning and goals

### 6. Group/Sharing
**Show:** Group view or profile showing shared features
**Focus:** Collaboration and connection

## Screenshot Tips

✅ **DO:**
- Use real, beautiful travel photos (or high-quality stock)
- Show the app in use with realistic data
- Make sure UI is polished and aligned
- Use light mode for consistency
- Include status bar (9:41 AM with full signal)
- Show variety of features

❌ **DON'T:**
- Use "Lorem ipsum" or placeholder text
- Show empty states or "No data" screens
- Include personal/sensitive information
- Use dark mode unless that's your brand
- Leave debugging elements visible

## Adding Text Overlays (Optional)

You can add promotional text to screenshots:
- "Plan Together" → over trip planning screen
- "Share Memories" → over photo screen
- "Explore the World" → over map screen

Tools: Figma, Canva, Photoshop, or Apple's App Preview tools

## Screenshot Naming

Save with descriptive names:
```
01-home-dashboard.png
02-trip-planning.png
03-photo-memories.png
04-world-map.png
05-bucket-list.png
06-group-profile.png
```

## Preview Video (Optional but Recommended)

### Requirements:
- Duration: 15-30 seconds
- Size: Same as screenshot sizes
- Format: .mov or .mp4

### What to Show:
1. App opening
2. Creating a trip
3. Adding photos
4. Viewing map
5. Browsing memories

Can be recorded with:
- iOS Simulator screen recording (`Cmd + R`)
- QuickTime screen recording
- Real device screen recording

## Checklist Before Upload

- [ ] At least 3 iPhone 6.7" screenshots
- [ ] Screenshots show real, polished content
- [ ] All text is legible
- [ ] No placeholder data visible
- [ ] Status bar looks good (9:41 AM)
- [ ] Screenshots showcase main features
- [ ] Files are correct dimensions
- [ ] Files are under 500KB each (usually PNG)
- [ ] Named clearly for organization

## Quick Screenshot Generator Script

If you need to generate screenshots programmatically, you can use:

```bash
# Navigate to each screen and capture
# iPhone 15 Pro Max simulator
xcrun simctl io booted screenshot screenshot.png
```

---

## Next Steps

1. Take screenshots using Simulator
2. Store in `assets/screenshots/` folder
3. Optionally add text overlays
4. Upload to App Store Connect when submitting
