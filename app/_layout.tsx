import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ItemsApiProvider } from '../context/ItemsApiContext';
import { EmployeesProvider } from '../context/EmployeesContext';
import { ReceiptProvider } from '../context/ReceiptContext';
import { CalendarProvider } from '../context/CalendarContext';
import { NavigationProvider } from '../context/NavigationContext';
import { ReportsProvider } from '../context/ReportsContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { AuthErrorBoundary } from '../components/ui/AuthErrorBoundary';
import { ItemsProvider } from '../context/ItemsContext';
import { ActivityTrackerWrapper } from '../components/ActivityTrackerWrapper';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <AuthProvider>
          <ActivityTrackerWrapper>
            <ItemsProvider>
              <NavigationProvider>
                <ItemsApiProvider>
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
                </ItemsApiProvider>
              </NavigationProvider>
            </ItemsProvider>
          </ActivityTrackerWrapper>
        </AuthProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}