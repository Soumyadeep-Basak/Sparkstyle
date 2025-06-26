import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Text, Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/constants/Api';
import { Ionicons } from '@expo/vector-icons';

export default function ImageUploadScreen() {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showError = (msg: string) => {
    setError(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setError(null));
  };

  const pickImage = async (which: 'front' | 'side') => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      which === 'front' ? setFrontImage(result.assets[0].uri) : setSideImage(result.assets[0].uri);
    }
  };

  const takePhoto = async (which: 'front' | 'side') => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      which === 'front' ? setFrontImage(result.assets[0].uri) : setSideImage(result.assets[0].uri);
    }
  };

  const checkFullBody = async () => {
    if (!frontImage || !sideImage) {
      showError('Please provide both front and side images.');
      return false;
    }
    setChecking(true);
    try {
      const check = async (uri: string) => {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const formData = new FormData();
        formData.append('image', {
          uri,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
        const response = await fetch(`${API_BASE_URL}/detect-fullbody`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return response.ok && data.full_body;
      };
      const [frontOk, sideOk] = await Promise.all([
        check(frontImage),
        check(sideImage),
      ]);
      if (!frontOk || !sideOk) {
        showError('Both images must clearly show your full body.');
        return false;
      }
      return true;
    } catch (e) {
      showError('Error checking images.');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage || !sideImage) {
      showError('Please provide both front and side images.');
      return;
    }
    if (!height || isNaN(Number(height)) || Number(height) < 50) {
      showError('Please enter a valid height in cm.');
      return;
    }
    setResults(null);
    const isFullBody = await checkFullBody();
    if (!isFullBody) return;
    setLoading(true);
    try {
      const makeFormData = () => {
        const fd = new FormData();
        const frontType = frontImage.split('.').pop();
        const sideType = sideImage.split('.').pop();
        fd.append('front', {
          uri: frontImage,
          name: `front.${frontType}`,
          type: `image/${frontType}`,
        } as any);
        fd.append('side', {
          uri: sideImage,
          name: `side.${sideType}`,
          type: `image/${sideType}`,
        } as any);
        fd.append('height', height);
        if (weight) fd.append('weight', weight);
        fd.append('gender', 'other'); // Could add gender selection later
        return fd;
      };
      const formData = makeFormData();
      const [mediapipeRes, yoloRes] = await Promise.all([
        fetch(`${API_BASE_URL}/predict-mediapipe`, {
          method: 'POST',
          body: formData,
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/predict-yolo`, {
          method: 'POST',
          body: formData,
        }).then(r => r.json()),
      ]);
      setResults({ mediapipe: mediapipeRes, yolo: yoloRes });
    } catch (e) {
      showError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = frontImage && sideImage && height && !loading && !checking;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Upload Front & Side Photos</Text>
        <Text style={styles.subtitle}>Stand straight, ensure your full body is visible in both images.</Text>
        <View style={styles.imageRow}>
          <View style={styles.imageCol}>
            <Text style={styles.label}>Front</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('front')} disabled={loading || checking}>
              {frontImage ? (
                <Image source={{ uri: frontImage }} style={styles.image} resizeMode="cover" />
              ) : (
                <Ionicons name="person-outline" size={48} color="#bbb" />
              )}
            </TouchableOpacity>
            <View style={styles.buttonRowSmall}>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={() => pickImage('front')} disabled={loading || checking}>
                <Ionicons name="image-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={() => takePhoto('front')} disabled={loading || checking}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.imageCol}>
            <Text style={styles.label}>Side</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('side')} disabled={loading || checking}>
              {sideImage ? (
                <Image source={{ uri: sideImage }} style={styles.image} resizeMode="cover" />
              ) : (
                <Ionicons name="person-outline" size={48} color="#bbb" style={{ transform: [{ rotate: '90deg' }] }} />
              )}
            </TouchableOpacity>
            <View style={styles.buttonRowSmall}>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={() => pickImage('side')} disabled={loading || checking}>
                <Ionicons name="image-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={() => takePhoto('side')} disabled={loading || checking}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="e.g. 170"
              keyboardType="numeric"
              editable={!loading && !checking}
              maxLength={3}
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="optional"
              keyboardType="numeric"
              editable={!loading && !checking}
              maxLength={3}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, { opacity: canSubmit ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {loading || checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Check & Predict</Text>
          )}
        </TouchableOpacity>
        {results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results</Text>
            <View style={styles.resultCardsRow}>
              <View style={styles.resultCard}>
                <Text style={styles.resultCardTitle}>MediaPipe</Text>
                {results.mediapipe && results.mediapipe.error ? (
                  <Text style={styles.resultError}>{results.mediapipe.error}</Text>
                ) : (
                  Object.entries(results.mediapipe || {}).map(([k, v]) => (
                    <Text key={k} style={styles.resultItem}><Text style={{ fontWeight: 'bold' }}>{k.replace(/_/g, ' ')}:</Text> {typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v)}</Text>
                  ))
                )}
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultCardTitle}>YOLO</Text>
                {results.yolo && results.yolo.error ? (
                  <Text style={styles.resultError}>{results.yolo.error}</Text>
                ) : (
                  Object.entries(results.yolo || {}).map(([k, v]) => (
                    <Text key={k} style={styles.resultItem}><Text style={{ fontWeight: 'bold' }}>{k.replace(/_/g, ' ')}:</Text> {typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v)}</Text>
                  ))
                )}
              </View>
            </View>
          </View>
        )}
        {error && (
          <Animated.View style={[styles.errorBox, { opacity: fadeAnim }]}> 
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  imageCol: {
    alignItems: 'center',
    flex: 1,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  buttonRowSmall: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSmall: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  inputRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  inputCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 340,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    width: '100%',
    maxWidth: 700,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  resultCardsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  resultCard: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 14,
    margin: 4,
    minWidth: 140,
    maxWidth: 240,
    alignItems: 'flex-start',
  },
  resultCardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#007AFF',
  },
  resultItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  resultError: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 6,
  },
}); 