import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

export default function JobBoardScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [posting, setPosting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCurrentUser();
      fetchJobs();
    }, [])
  );

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company,
        location,
        description,
        contact_email,
        created_at,
        user_id,
        users (
          id,
          name,
          graduation_year
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'Could not load jobs');
    } else {
      setJobs(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function handlePostJob() {
    if (!title.trim() || !company.trim()) {
      Alert.alert('Error', 'Job title and company are required');
      return;
    }

    setPosting(true);

    const { error } = await supabase.from('jobs').insert({
      user_id: currentUserId,
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description: description.trim(),
      contact_email: contactEmail.trim(),
    });

    if (error) {
      Alert.alert('Error', 'Could not post job: ' + error.message);
    } else {
      Alert.alert('Success', 'Job posted!');
      setTitle('');
      setCompany('');
      setLocation('');
      setDescription('');
      setContactEmail('');
      setShowPostForm(false);
      fetchJobs();
    }
    setPosting(false);
  }

  async function handleDeleteJob(jobId) {
    Alert.alert('Delete Job', 'Remove this job posting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId);
          if (!error) setJobs((prev) => prev.filter((j) => j.id !== jobId));
        },
      },
    ]);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, []);

  function renderJob({ item }) {
    const isMyJob = item.user_id === currentUserId;
    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            {isMyJob && (
              <TouchableOpacity onPress={() => handleDeleteJob(item.id)}>
                <Text style={{ fontSize: 14 }}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.company}>{item.company}</Text>
          {item.location ? (
            <Text style={styles.location}>📍 {item.location}</Text>
          ) : null}
        </View>

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        <View style={styles.jobFooter}>
          <View style={styles.postedByRow}>
            <Text style={styles.postedBy}>
              Posted by {item.users?.name || 'Alumni'}
              {item.users?.graduation_year ? ` · Batch ${item.users.graduation_year}` : ''}
            </Text>
            <Text style={styles.jobDate}>{formatDate(item.created_at)}</Text>
          </View>
          {item.contact_email ? (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Contact: </Text>
              <Text style={styles.contactEmail}>{item.contact_email}</Text>
            </View>
          ) : null}
        </View>
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
      {/* Post a Job Button */}
      <TouchableOpacity
        style={styles.postJobButton}
        onPress={() => setShowPostForm(true)}
      >
        <Text style={styles.postJobButtonText}>+ Post a Job / Opportunity</Text>
      </TouchableOpacity>

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#950606" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No job postings yet.</Text>
            <Text style={styles.emptySubText}>Be the first to post an opportunity!</Text>
          </View>
        }
        contentContainerStyle={jobs.length === 0 ? { flexGrow: 1 } : { paddingBottom: 16 }}
      />

      {/* Post Job Modal */}
      <Modal
        visible={showPostForm}
        animationType="slide"
        onRequestClose={() => setShowPostForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post a Job</Text>
            <TouchableOpacity onPress={() => setShowPostForm(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Software Engineer"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Company *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Google, Startup Inc."
              value={company}
              onChangeText={setCompany}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mumbai, Remote"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Job details, requirements, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email for applications"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitButton, posting && { opacity: 0.6 }]}
              onPress={handlePostJob}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Post Job</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPostForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  postJobButton: {
    backgroundColor: '#950606',
    margin: 12,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  postJobButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  jobCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  jobHeader: {
    marginBottom: 10,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: '#950606',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    paddingTop: 10,
  },
  jobFooter: {
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    paddingTop: 8,
  },
  postedByRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  postedBy: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  jobDate: {
    fontSize: 11,
    color: '#aaa',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
  },
  contactEmail: {
    fontSize: 12,
    color: '#950606',
    fontWeight: '500',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#950606',
  },
  modalClose: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },
  formContent: {
    padding: 20,
    backgroundColor: '#fff',
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
  },
  multiline: {
    minHeight: 90,
  },
  submitButton: {
    backgroundColor: '#950606',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  submitButtonText: {
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
  },
});
