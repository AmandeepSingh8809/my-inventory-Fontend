import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    // This hides the default Expo header so your custom TopHeader looks perfect
    <Stack screenOptions={{ headerShown: false }} />
  );
}