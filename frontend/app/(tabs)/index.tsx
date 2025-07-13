import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors } from '@/constants/Colors';

const MOCK_EMAIL = 'admin@admin.com';
const MOCK_PASSWORD = 'admin123';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setError('');
      router.replace('/(tabs)/admin-dashboard');
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Admin Login</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.light.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.light.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <ThemedText style={styles.buttonText}>Login</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  title: {
    marginBottom: 32,
    color: Colors.light.primary,
  },
  input: {
    width: '100%',
    maxWidth: 340,
    height: 48,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
  },
  button: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  error: {
    color: Colors.light.error,
    marginBottom: 10,
    fontSize: 15,
  },
});
