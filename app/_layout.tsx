import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ItemsApiProvider } from '../context/ItemsApiContext';
import { EmployeesProvider } from '../context/EmployeesContext';
import { ReceiptProvider } from '../context/ReceiptContext';
import { CalendarProvider } from '../context/CalendarContext';
import { ProfileProvider } from '../context/ProfileContext';
import { NavigationProvider } from '../context/NavigationContext';
import { ReportsProvider } from '../context/ReportsContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { AuthErrorBoundary } from '../components/ui/AuthErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <AuthProvider>
          <NavigationProvider>
            <ItemsApiProvider>
              <EmployeesProvider>
                <ReportsProvider>
                  <ProfileProvider>
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
                  </ProfileProvider>
                </ReportsProvider>
              </EmployeesProvider>
            </ItemsApiProvider>
          </NavigationProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}