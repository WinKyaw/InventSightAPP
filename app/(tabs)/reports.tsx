import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Header } from '../../components/shared/Header';
import { styles } from '../../constants/Styles';

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <Header 
        title="Reports & Analytics"
        subtitle="Business Intelligence Dashboard"
        backgroundColor="#10B981"
        showProfileButton={true}
      />
      
      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiContainer}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>📊 Coming Soon</Text>
            <Text style={styles.performanceUnits}>
              Advanced reporting features are being developed.{'\n\n'}
              This will include:{'\n'}
              • Sales trends and forecasting{'\n'}
              • Inventory analytics{'\n'}
              • Employee performance{'\n'}
              • Financial reports{'\n'}
              • Custom dashboards
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}