import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false}} />
      <Stack.Screen name="anyspace" options={{ title: "AnySpace", headerShown: false, gestureEnabled: false }} />
    </Stack>
  )
}
