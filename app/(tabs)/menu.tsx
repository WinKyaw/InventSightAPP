import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Menu handled by hamburger button
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});