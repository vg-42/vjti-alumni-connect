import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function DirectoryScreen() {
  const [alumni, setAlumni] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAlumni();
    }, [])
  );

  async function fetchAlumni() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, graduation_year, specialization, bio, email')
      .order('graduation_year', { ascending: false });

    if (error) {
      Alert.alert('Error', 'Could not load alumni');
    } else {
      setAlumni(data || []);
      setFiltered(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function handleSearch(text) {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(alumni);
      return;
    }
    const lower = text.toLowerCase();
    const results = alumni.filter(
      (a) =>
        a.name?.toLowerCase().includes(lower) ||
        a.specialization?.toLowerCase().includes(lower) ||
        a.graduation_year?.includes(lower)
    );
    setFiltered(results);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlumni();
  }, []);

  function renderAlumni({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.leftRow}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            {item.specialization ? (
              <Text style={styles.spec}>{item.specialization}</Text>
            ) : null}
            {item.email ? (
              <Text style={styles.email}>✉️ {item.email}</Text>
            ) : null}
            {item.bio ? (
              <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
            ) : null}
          </View>
        </View>
        {item.graduation_year ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>Batch {item.graduation_year}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#950606" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search by name, branch, or batch year..."
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filtered.length} alumni registered
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderAlumni}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#950606" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alumni found.</Text>
            <Text style={styles.emptySubText}>Try a different search term.</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? { flexGrow: 1 } : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f2ef',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f3f2ef',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statsBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  leftRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#950606',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  spec: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  bio: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  yearBadge: {
    backgroundColor: '#fdeaea',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#950606',
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  yearText: {
    fontSize: 11,
    color: '#950606',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
  },
});
