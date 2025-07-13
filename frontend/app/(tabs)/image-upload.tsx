import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImageUploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Ask for permission
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
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Ask for permission
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
      setImage(result.assets[0].uri);
    }
  };

  const checkFullBody = async (imageUri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch('https://api-inference.huggingface.co/models/Xenova/yolov8n-pose', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer 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', // <-- Replace with your token
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response body:', result);

      const keypoints = result[0]?.keypoints || [];
      const hasFeet = keypoints.some((p: any) => p.label.includes('foot'));
      const hasHead = keypoints.some((p: any) => p.label.includes('head') || p.label.includes('nose'));
      const hasHips = keypoints.some((p: any) => p.label.includes('hip'));

      if (hasFeet && hasHead && hasHips) {
        alert('✅ Full body detected');
      } else {
        alert('❌ Full body not visible');
      }
    } catch (error) {
      console.log('Error verifying image:', error);
      alert('Error verifying image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      <View style={{ height: 16 }} />
      <Button title="Capture a photo" onPress={takePhoto} />
      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
          <View style={{ height: 16 }} />
          <Button title="Verify Full Body" onPress={() => checkFullBody(image)} disabled={loading} />
          {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
}); 