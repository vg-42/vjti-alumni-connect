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

export default function EditProfileScreen({ navigation, route }) {
  const existingProfile = route.params?.profile || {};

  const [name, setName] = useState(existingProfile.name || '');
  const [bio, setBio] = useState(existingProfile.bio || '');
  const [email, setEmail] = useState(existingProfile.email || '');
  const [graduationYear, setGraduationYear] = useState(existingProfile.graduation_year || '');
  const [specialization, setSpecialization] = useState(existingProfile.specialization || '');
  const [avatarUri, setAvatarUri] = useState(existingProfile.avatar_url || '');
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to change avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
    }
  }

async function uploadAvatar(uri) {
  const { data: { user } } = await supabase.auth.getUser();
  const filePath = `avatars/${user.id}.jpg`;
  const fileName = `${user.id}.jpg`;

  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: fileName,
    type: 'image/jpeg',
  });

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, formData, { contentType: 'multipart/form-data', upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return urlData.publicUrl + '?t=' + Date.now();
}

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }

      let finalAvatarUrl = avatarUri;
      if (newImageUri) {
        finalAvatarUrl = await uploadAvatar(newImageUri);
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          bio: bio.trim(),
          email: email.trim(),
          graduation_year: graduationYear.trim(),
          specialization: specialization.trim(),
          avatar_url: finalAvatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Could not update profile: ' + error.message);
      } else {
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong: ' + err.message);
    }

    setLoading(false);
  }

  const displayImage = newImageUri || avatarUri;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickAvatar}>
            <Text style={styles.changePhotoText}>📷 Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Your email address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Graduation Year */}
        <Text style={styles.label}>Graduation Year</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2025"
          placeholderTextColor="#999"
          value={graduationYear}
          onChangeText={setGraduationYear}
          keyboardType="numeric"
          maxLength={4}
        />

        {/* Specialization */}
        <Text style={styles.label}>Specialization / Branch</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Electronics and Telecommunications"
          placeholderTextColor="#999"
          value={specialization}
          onChangeText={setSpecialization}
          autoCapitalize="words"
        />

        {/* Bio */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell people about yourself..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#950606',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#950606',
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#950606',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  bioInput: {
    minHeight: 90,
  },
  saveButton: {
    backgroundColor: '#950606',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
});
