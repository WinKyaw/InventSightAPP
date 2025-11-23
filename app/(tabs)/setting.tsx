import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/shared/Header';
import { styles } from '../../constants/Styles';

export default function SettingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
      <Header 
        title="App Settings"
        subtitle="Configure your POS system"
        backgroundColor="#6B7280"
        showProfileButton={true}
      />
      
      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiContainer}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>⚙️ Settings Panel</Text>
            <Text style={styles.performanceUnits}>
              Application settings are being developed.{'\n\n'}
              📅 Current DateTime (UTC): 2025-08-25 17:13:56{'\n'}
              👤 Current User: WinKyaw{'\n\n'}
              Future settings will include:{'\n'}
              • Tax rate configuration{'\n'}
              • Receipt customization{'\n'}
              • Backup and restore{'\n'}
              • Theme preferences{'\n'}
              • Notification settings{'\n'}
              • Language options
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}