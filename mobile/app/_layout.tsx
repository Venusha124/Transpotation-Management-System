import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }}>
        <Stack.Screen name="index" options={{ title: 'Login' }} />
        <Stack.Screen name="driver" options={{ title: 'Driver Portal' }} />
        <Stack.Screen name="conductor" options={{ title: 'Conductor POS' }} />
      </Stack>
    </>
  );
}
