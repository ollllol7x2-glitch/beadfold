import { Redirect } from 'expo-router';

/** Legacy URL. Global Add is now an action sheet, not a navigation destination. */
export default function AddMenuScreen() {
  return <Redirect href="/(tabs)" />;
}
