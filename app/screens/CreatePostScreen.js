import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

async function uploadImage(uri) {
  const fileName = `post_${Date.now()}.jpg`;
  const filePath = `posts/${fileName}`;

  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: fileName,
    type: 'image/jpeg',
  });

  const { error } = await supabase.storage
    .from('posts')
    .upload(filePath, formData, { contentType: 'multipart/form-data', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
  return urlData.publicUrl;
}

  async function handleCreatePost() {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to post');
        setLoading(false);
        return;
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
      });

      if (error) {
        Alert.alert('Error', 'Could not create post: ' + error.message);
      } else {
        Alert.alert('Success', 'Post created!', [
          {
            text: 'OK',
            onPress: () => {
              setContent('');
              setImage(null);
              // Navigate to feed tab to see the post
              navigation.navigate('Feed');
            },
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <TextInput
          style={styles.textInput}
          placeholder="Share something with your alumni network..."
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus={false}
        />

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeImageText}>✕ Remove Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {!image && (
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Text style={styles.addImageText}>📷 Add Image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.postButton, loading && styles.buttonDisabled]}
          onPress={handleCreatePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => { setContent(''); setImage(null); }}
          disabled={loading}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 140,
    backgroundColor: '#fafafa',
    marginBottom: 16,
    color: '#000',
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  removeImageText: {
    color: '#cc0000',
    fontSize: 14,
    fontWeight: '500',
  },
  addImageButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 15,
    color: '#555',
  },
  postButton: {
    backgroundColor: '#950606',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
});
