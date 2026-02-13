import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EnergyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy</Text>
      <Text style={styles.subtitle}>Food and sleep</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
