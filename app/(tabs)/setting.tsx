import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/shared/Header';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../constants/Styles';

export default function SettingScreen() {
  const { t } = useTranslation();
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Settings: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
      <Header 
        title={t('setting.title')}
        subtitle={t('setting.subtitle')}
        backgroundColor="#6B7280"
        showProfileButton={true}
      />
      
      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiContainer}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>⚙️ {t('setting.settingsPanel')}</Text>
            <Text style={styles.performanceUnits}>
              {t('setting.appSettingsBeingDeveloped')}{'\n\n'}
              📅 Current DateTime (UTC): 2025-08-25 17:13:56{'\n'}
              👤 Current User: WinKyaw{'\n\n'}
              {t('setting.futureSettings')}{'\n'}
              • {t('setting.taxRateConfig')}{'\n'}
              • {t('setting.receiptCustomization')}{'\n'}
              • Backup and restore{'\n'}
              • {t('setting.themePreferences')}{'\n'}
              • {t('setting.notificationSettings')}{'\n'}
              • {t('setting.languageOptions')}
            </Text>
          </View>
          
          {/* Language Selector Section */}
          <View style={[styles.performanceCard, { marginTop: 16 }]}>
            <Text style={[styles.performanceTitle, { marginBottom: 16 }]}>🌐 {t('setting.language')}</Text>
            <LanguageSelector />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}