import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../core/api/transactions';
import type { ApiTransaction } from '../core/api/transactions';

function TransactionRow({ item }: { item: ApiTransaction }) {
  const isIncome = item.type === 'income';
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowCategory}>{item.category}</Text>
        {item.description ? (
          <Text style={styles.rowDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.rowDate}>{item.date}</Text>
      </View>
      <Text style={[styles.rowAmount, isIncome ? styles.amountIncome : styles.amountExpense]}>
        {isIncome ? '+' : '-'}{item.amount} {item.currency ?? 'USD'}
      </Text>
    </View>
  );
}

export function MoneyScreen() {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.list({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Failed to load'}</Text>
      </View>
    );
  }

  const list = transactions ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>{list.length} transaction(s)</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorText: {
    color: '#c00',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  empty: {
    color: '#666',
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLeft: {
    flex: 1,
  },
  rowCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rowDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountIncome: {
    color: '#16a34a',
  },
  amountExpense: {
    color: '#dc2626',
  },
});
