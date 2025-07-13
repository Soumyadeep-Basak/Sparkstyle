import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/auth-context';
import { getUserImages } from '@/constants/Api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const imgs = await getUserImages(user.id);
        setImages(imgs);
      } catch (err: any) {
        setError(err.message || 'Failed to load images');
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>No user information available. Please log in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.info}>ID: {user.id}</Text>
      <Text style={styles.info}>Username: {user.username}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.imagesTitle}>Uploaded Images</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#888" style={{ marginTop: 10 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : images.length === 0 ? (
        <Text style={styles.info}>No images uploaded yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {images.map((img) => (
            <View key={img.id} style={styles.imageWrapper}>
              <Image source={{ uri: img.image_url }} style={styles.image} />
              <Text style={styles.imageType}>{img.image_type}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
  imagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  imageScroll: {
    maxHeight: 140,
    alignSelf: 'stretch',
  },
  imageWrapper: {
    marginRight: 16,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 120,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#eee',
  },
  imageType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});

export default ProfilePage; 