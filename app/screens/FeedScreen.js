import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../services/supabase';
import PostCard from '../components/PostCard';

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
  }, []);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function fetchPosts() {
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'Could not load posts: ' + error.message);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function handlePostDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#950606" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={currentUserId}
            onPostDeleted={handlePostDeleted}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#950606" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet.</Text>
            <Text style={styles.emptySubText}>Be the first to post something!</Text>
          </View>
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyList : null}
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
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
  },
});
