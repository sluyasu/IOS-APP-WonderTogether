# WonderTogether

A beautiful mobile app for couples and groups to plan trips, share memories, and create adventures together.

## Features

- 👥 **Multi-Group Support**: Create and manage multiple travel groups
- ✈️ **Trip Planning**: Plan and organize trips with your loved ones
- 📸 **Memory Sharing**: Upload and share photos from your adventures
- 🗺️ **Interactive Map**: Visualize all your travels on a world map
- 📅 **Calendar Integration**: Keep track of upcoming trips and events
- 🎯 **Bucket List**: Create and track shared travel goals
- 📊 **Travel Stats**: See your travel statistics and achievements

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

### Running the App

Start the development server:
```bash
npm start
```

Or run on specific platforms:
```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## Building for Production

### Prerequisites for Building

- Expo Application Services (EAS) account
- Apple Developer account (for iOS builds)
- Google Play Console account (for Android builds)

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Configure EAS

1. Log in to EAS:
   ```bash
   eas login
   ```

2. Configure your project:
   ```bash
   eas build:configure
   ```

### Build Commands

**iOS Build:**
```bash
eas build --platform ios --profile production
```

**Android Build:**
```bash
eas build --platform android --profile production
```

**Development Build:**
```bash
eas build --platform all --profile development
```

## Project Structure

```
wonder-together-mobile/
├── app/                    # App screens and navigation
│   ├── (app)/             # Protected app screens
│   ├── auth/              # Authentication screens
│   ├── group-*/           # Group management screens
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # Supabase client
│   ├── storage.ts        # File upload utilities
│   ├── permissions.ts    # Permission management
│   └── groups.ts         # Group management logic
├── contexts/              # React contexts
├── assets/                # Images, icons, fonts
└── supabase/             # Database migrations

```

## Permissions

The app requests the following permissions:

- **Camera**: To capture travel moments
- **Photos**: To upload and save memories
- **Location**: To tag photos and show travels on map
- **Notifications**: For trip reminders (future feature)

All permissions are requested with user-friendly explanations and can be managed in device settings.

## Database

The app uses Supabase for backend services:

- **Authentication**: Email/password auth
- **Database**: PostgreSQL with Row Level Security
- **Storage**: For photos and media files

### Running Migrations

Migrations are located in `supabase/migrations/`. To apply them:

1. Install Supabase CLI
2. Link your project: `supabase link`
3. Push migrations: `supabase db push`

## Privacy & Compliance

- Privacy Policy: [URL to be added]
- Terms of Service: [URL to be added]
- Data is stored securely in Supabase
- Users have full control over their data
- Support for data export and deletion

## Tech Stack

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **Backend**: Supabase
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Maps**: React Native Maps
- **Icons**: Lucide React Native

## Troubleshooting

### Common Issues

**Build Errors:**
- Make sure all environment variables are set in `.env`
- Clear cache: `expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Permission Issues:**
- Check that permissions are properly configured in `app.json`
- Ensure Info.plist descriptions are user-friendly
- Test permissions on a real device

**Database Issues:**
- Verify Supabase credentials in `.env`
- Check that migrations are applied
- Verify Row Level Security policies

## Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## License

All rights reserved.

## Support

For issues or questions, contact: [your-email@example.com]
