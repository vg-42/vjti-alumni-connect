import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

export default function PostCard({ post, currentUserId, onPostDeleted }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, []);

  async function fetchLikes() {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    setLikeCount(count || 0);

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .single();

    if (data) setLiked(true);
  }

  async function fetchComments() {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        users (
          id,
          name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (!error) setComments(data || []);
    setCommentsLoading(false);
  }

  async function handleLikeToggle() {
    if (likeLoading) return;
    setLikeLoading(true);

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId);

      if (!error) {
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from('likes').insert({
        post_id: post.id,
        user_id: currentUserId,
      });

      if (!error) {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    }
    setLikeLoading(false);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setCommentLoading(true);

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUserId,
      content: commentText.trim(),
    });

    if (error) {
      Alert.alert('Error', 'Could not add comment');
    } else {
      setCommentText('');
      fetchComments();
    }
    setCommentLoading(false);
  }

  async function handleDeleteComment(commentId) {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
          if (!error) fetchComments();
        },
      },
    ]);
  }

  async function handleDeletePost() {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id);

          if (error) {
            Alert.alert('Error', 'Could not delete post');
          } else {
            if (onPostDeleted) onPostDeleted(post.id);
          }
        },
      },
    ]);
  }

  function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) fetchComments();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  const isMyPost = post.user_id === currentUserId;

  return (
    <View style={styles.card}>
      {/* User Info Row */}
      <View style={styles.userRow}>
        {post.users?.avatar_url ? (
          <Image source={{ uri: post.users.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {post.users?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{post.users?.name || 'Unknown'}</Text>
            {post.users?.graduation_year ? (
              <View style={styles.batchBadge}>
                <Text style={styles.batchText}>Batch {post.users.graduation_year}</Text>
              </View>
            ) : null}
          </View>
          {post.users?.specialization ? (
            <Text style={styles.specialization}>{post.users.specialization}</Text>
          ) : null}
          <Text style={styles.timestamp}>{formatDate(post.created_at)}</Text>
        </View>

        {/* Delete button — only show on your own posts */}
        {isMyPost && (
          <TouchableOpacity onPress={handleDeletePost} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Post Image */}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikeToggle}
          disabled={likeLoading}
        >
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={[styles.actionText, liked && styles.activeText]}>
            {liked ? 'Liked' : 'Like'}{likeCount > 0 ? ` · ${likeCount}` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={toggleComments}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>
            Comment{comments.length > 0 ? ` · ${comments.length}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {commentsLoading ? (
            <ActivityIndicator size="small" color="#950606" style={{ marginVertical: 8 }} />
          ) : (
            <>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  {comment.users?.avatar_url ? (
                    <Image source={{ uri: comment.users.avatar_url }} style={styles.commentAvatar} />
                  ) : (
                    <View style={styles.commentAvatarPlaceholder}>
                      <Text style={styles.commentAvatarInitial}>
                        {comment.users?.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentName}>{comment.users?.name || 'Unknown'}</Text>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.created_at)}</Text>
                  </View>
                  {comment.user_id === currentUserId && (
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(comment.id)}
                      style={styles.commentDeleteBtn}
                    >
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {comments.length === 0 && (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              )}

              {/* Add Comment Input */}
              <View style={styles.addCommentRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.postCommentBtn, !commentText.trim() && styles.postCommentBtnDisabled]}
                  onPress={handleAddComment}
                  disabled={commentLoading || !commentText.trim()}
                >
                  {commentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.postCommentBtnText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  batchBadge: {
    backgroundColor: '#fdeaea',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#950606',
  },
  batchText: {
    fontSize: 11,
    color: '#950606',
    fontWeight: '600',
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  content: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  actionsRow: {
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    paddingTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  activeText: {
    color: '#950606',
    fontWeight: '600',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: 10,
    paddingTop: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#950606',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarInitial: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 8,
  },
  commentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
  },
  commentDeleteBtn: {
    padding: 4,
    marginLeft: 4,
    alignSelf: 'center',
  },
  noComments: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 8,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fafafa',
    maxHeight: 80,
  },
  postCommentBtn: {
    backgroundColor: '#950606',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postCommentBtnDisabled: {
    opacity: 0.4,
  },
  postCommentBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
