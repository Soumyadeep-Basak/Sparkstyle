import React, { useState, createContext, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/Api';

// Create a context for the analysis result
export const AnalysisResultContext = createContext({ result: null, setResult: (_: any) => {} });

export function useAnalysisResult() {
  return useContext(AnalysisResultContext);
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  // Helper to validate full body image
  const validateFullBody = async (uri: string) => {
    try {
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
      if (!response.ok || !data.full_body) {
        Alert.alert('Please select a clear full body image.');
        return false;
      }
      return true;
    } catch (e) {
      Alert.alert('Error validating image.');
      return false;
    }
  };

  const pickImage = async (which: 'front' | 'side') => {
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
      const uri = result.assets[0].uri;
      const isFullBody = await validateFullBody(uri);
      if (!isFullBody) return;
      which === 'front' ? setFrontImage(uri) : setSideImage(uri);
    }
  };

  const takePhoto = async (which: 'front' | 'side') => {
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
      const uri = result.assets[0].uri;
      const isFullBody = await validateFullBody(uri);
      if (!isFullBody) return;
      which === 'front' ? setFrontImage(uri) : setSideImage(uri);
    }
  };

  const handleAnalyse = async () => {
    if (!frontImage || !sideImage || !height) {
      Alert.alert('Missing info', 'Please provide all required information.');
      return;
    }
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
        fd.append('gender', 'other');
        return fd;
      };
      const formData = makeFormData();
      // Call the new /predict-avg endpoint
      const response = await fetch(`${API_BASE_URL}/predict-avg`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.error) {
        Alert.alert('Analysis failed', result.error);
        setLoading(false);
        return;
      }
      setResult(result); // Store in context
      router.replace('/(tabs)/store');
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalysisResultContext.Provider value={{ result, setResult }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.card}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
              <Text style={styles.title}>Welcome to Walmart Shopping Experience</Text>
              <Text style={styles.subtitle}>Let&apos;s get started by knowing you!</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, !(name && email) && styles.buttonDisabled]}
                disabled={!(name && email)}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.title}>Step 1: Upload Front Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('front')}>
                {frontImage ? (
                  <Image source={{ uri: frontImage }} style={styles.image} resizeMode="cover" />
                ) : (
                  <Text style={styles.imagePlaceholder}>Tap to select front image</Text>
                )}
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8, justifyContent: 'center' }}>
                <TouchableOpacity style={styles.actionButtonLarge} onPress={() => takePhoto('front')}>
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonLarge} onPress={() => pickImage('front')}>
                  <Text style={styles.actionButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.button, !frontImage && styles.buttonDisabled]}
                disabled={!frontImage}
                onPress={() => setStep(3)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.title}>Step 2: Upload Side Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('side')}>
                {sideImage ? (
                  <Image source={{ uri: sideImage }} style={styles.image} resizeMode="cover" />
                ) : (
                  <Text style={styles.imagePlaceholder}>Tap to select side image</Text>
                )}
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8, justifyContent: 'center' }}>
                <TouchableOpacity style={styles.actionButtonLarge} onPress={() => takePhoto('side')}>
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonLarge} onPress={() => pickImage('side')}>
                  <Text style={styles.actionButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg) (optional)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.button, !(sideImage && height) && styles.buttonDisabled]}
                disabled={!(sideImage && height)}
                onPress={handleAnalyse}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyse</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AnalysisResultContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    width: '100%',
    backgroundColor: '#0071ce',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePicker: {
    width: 180,
    height: 220,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionButtonLarge: {
    width: 120,
    height: 40,
    backgroundColor: '#0071ce',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
