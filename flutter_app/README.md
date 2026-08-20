# BEANFOLD Flutter

The Flutter replacement app for BEANFOLD. It uses the existing Supabase project and the same owner-scoped tables already used by the web prototype.

## Current scope

- Google OAuth through Supabase
- Persistent native session through `supabase_flutter`
- Supabase-backed bean collection: list and add
- Native navigation, haptic feedback and Flutter motion foundation

The existing Expo app remains in the repository during the migration and is not part of this Flutter build.

## Run

```bash
flutter pub get
flutter run
```

## Required Supabase auth setting for native builds

Add this exact redirect URL to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** before testing Google sign-in on a device:

```text
com.beanfold.app://login-callback/
```

Google's OAuth client continues to use the Supabase callback URL already configured in Google Cloud Console. Do not add the mobile deep-link URL to Google Cloud Console.

## Push notifications

Push requires a Firebase project (Android) and APNs key (iOS). It is intentionally not configured until the brew timer flow is migrated, so notification permission is requested only when there is a meaningful brew alert to deliver.
