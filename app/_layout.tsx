import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ItemsProvider } from '../context/ItemsContext';
import { EmployeesProvider } from '../context/EmployeesContext';
import { ReceiptProvider } from '../context/ReceiptContext';
import { CalendarProvider } from '../context/CalendarContext';
import { NavigationProvider } from '../context/NavigationContext';
import { ReportsProvider } from '../context/ReportsContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationProvider>
          <ItemsProvider>
            <EmployeesProvider>
              <ReportsProvider>
                <ReceiptProvider>
                  <CalendarProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
                    </Stack>
                  </CalendarProvider>
                </ReceiptProvider>
              </ReportsProvider>
            </EmployeesProvider>
          </ItemsProvider>
        </NavigationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}