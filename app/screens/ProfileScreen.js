import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import PostCard from '../components/PostCard';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      Alert.alert('Error', 'Could not load profile');
    } else {
      setProfile(profileData);
    }

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        created_at,
        user_id,
        users (
          id,
          name,
          avatar_url,
          graduation_year,
          specialization
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!postsError) setPosts(postsData || []);

    setLoading(false);
    setRefreshing(false);
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert('Error', error.message);
        },
      },
    ]);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#950606" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
            post={item}
            currentUserId={currentUserId}
            onPostDeleted={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
          />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#950606" />
      }
      style={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.profileCard}>
            {/* Avatar */}
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}

            {/* Name */}
            <Text style={styles.name}>{profile?.name || 'No Name'}</Text>

            {/* Batch + Specialization badges */}
            <View style={styles.badgeRow}>
              {profile?.graduation_year ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🎓 Batch {profile.graduation_year}</Text>
                </View>
              ) : null}
              {profile?.specialization ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>📚 {profile.specialization}</Text>
                </View>
              ) : null}
            </View>

            {/* Email */}
            {profile?.email ? (
              <Text style={styles.email}>✉️ {profile.email}</Text>
            ) : null}

            {/* Bio */}
            <Text style={styles.bio}>
              {profile?.bio || 'No bio yet. Tap Edit Profile to add one.'}
            </Text>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile', { profile })}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Posts ({posts.length})</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet.</Text>
          <Text style={styles.emptySubText}>Create your first post!</Text>
        </View>
      }
    />
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
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#950606',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#fdeaea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#950606',
  },
  badgeText: {
    fontSize: 12,
    color: '#950606',
    fontWeight: '600',
  },
  email: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  editButton: {
    borderWidth: 1.5,
    borderColor: '#950606',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  editButtonText: {
    color: '#950606',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  logoutText: {
    color: '#888',
    fontSize: 14,
  },
  sectionHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
