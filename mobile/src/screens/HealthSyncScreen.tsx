import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Switch, Button, List, ActivityIndicator } from 'react-native-paper';
import { useHealthSync } from '../hooks/useHealthSync';

const DATA_TYPES = [
  { key: 'workouts', label: 'Workouts', description: 'Sync exercise sessions', icon: 'dumbbell' },
  { key: 'sleep', label: 'Sleep', description: 'Sync sleep tracking data', icon: 'weather-night' },
  { key: 'nutrition', label: 'Nutrition', description: 'Sync food and calorie data', icon: 'food-apple' },
  { key: 'metrics', label: 'Steps & Heart Rate', description: 'Sync daily activity metrics', icon: 'heart-pulse' },
];

function platformLabel(platform: string | null): string {
  if (platform === 'apple_health') return 'Apple Health';
  if (platform === 'health_connect') return 'Health Connect';
  return 'Health Platform';
}

export function HealthSyncScreen() {
  const {
    platform,
    isNative,
    syncing,
    syncState,
    syncStateLoading,
    lastResult,
    syncNow,
    toggleDataType,
  } = useHealthSync();

  if (!isNative) {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="bodyMedium" style={styles.muted}>
              Health sync is not available on this platform.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  const isEnabled = (dataType: string) =>
    syncState.find((s) => s.dataType === dataType)?.enabled ?? true;

  const lastSyncTime = (dataType: string) => {
    const state = syncState.find((s) => s.dataType === dataType);
    if (!state?.lastSyncedAt) return null;
    return new Date(state.lastSyncedAt).toLocaleString();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.platformBadge}>
            <Text variant="bodyMedium" style={styles.platformText}>
              Connected to {platformLabel(platform)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Data Types</Text>
          {syncStateLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            DATA_TYPES.map(({ key, label, description, icon }) => (
              <List.Item
                key={key}
                title={label}
                description={lastSyncTime(key) ? `${description}\nLast: ${lastSyncTime(key)}` : description}
                descriptionNumberOfLines={2}
                left={(props) => <List.Icon {...props} icon={icon} />}
                right={() => (
                  <Switch
                    value={isEnabled(key)}
                    onValueChange={(v) => toggleDataType(key, v)}
                  />
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>

      <View style={styles.syncSection}>
        <Button
          mode="contained"
          onPress={syncNow}
          disabled={syncing}
          loading={syncing}
          icon={syncing ? undefined : 'sync'}
          style={styles.syncButton}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>

        {lastResult && (
          <Card style={styles.resultCard} mode="outlined">
            <Card.Content>
              <Text variant="titleSmall" style={styles.resultTitle}>Last Sync Results</Text>
              {lastResult.workoutsCreated > 0 && (
                <Text variant="bodySmall">{lastResult.workoutsCreated} new workouts</Text>
              )}
              {lastResult.workoutsUpdated > 0 && (
                <Text variant="bodySmall">{lastResult.workoutsUpdated} updated workouts</Text>
              )}
              {lastResult.sleepSynced > 0 && (
                <Text variant="bodySmall">{lastResult.sleepSynced} sleep records</Text>
              )}
              {lastResult.nutritionSynced > 0 && (
                <Text variant="bodySmall">{lastResult.nutritionSynced} nutrition entries</Text>
              )}
              {lastResult.metricsSynced > 0 && (
                <Text variant="bodySmall">{lastResult.metricsSynced} metrics</Text>
              )}
              {lastResult.workoutsCreated === 0 && lastResult.workoutsUpdated === 0 &&
               lastResult.sleepSynced === 0 && lastResult.nutritionSynced === 0 &&
               lastResult.metricsSynced === 0 && (
                <Text variant="bodySmall" style={styles.muted}>Already up to date</Text>
              )}
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  card: { marginBottom: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  platformBadge: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  platformText: { color: '#166534' },
  muted: { color: '#6b7280' },
  loader: { marginVertical: 16 },
  syncSection: { marginTop: 8, marginBottom: 32 },
  syncButton: { marginBottom: 16 },
  resultCard: { marginTop: 8 },
  resultTitle: { fontWeight: '600', marginBottom: 4 },
});
