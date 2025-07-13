import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAnalysisResult } from '../(tabs)';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { mockVirtualTryOn } from '@/constants/Api';

export default function StoreScreen() {
  const { result } = useAnalysisResult();

  // Virtual Try-On State
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnMessage, setTryOnMessage] = useState<string | null>(null);

  // Pick or capture image for try-on
  const handleTryOnImage = async (fromCamera: boolean) => {
    setTryOnMessage(null);
    setTryOnResult(null);
    let result;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setTryOnMessage('Camera permission denied');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setTryOnMessage('Media library permission denied');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    }
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTryOnImage(result.assets[0].uri);
      await handleVirtualTryOn(result.assets[0].uri);
    }
  };

  // Call mock API
  const handleVirtualTryOn = async (imageUri: string) => {
    setTryOnLoading(true);
    setTryOnResult(null);
    setTryOnMessage(null);
    try {
      const res = await mockVirtualTryOn(imageUri);
      if (res.success) {
        setTryOnResult(res.tryOnImageUrl);
        setTryOnMessage(res.message);
      } else {
        setTryOnMessage('Try-on failed. Please try again.');
      }
    } catch (e) {
      setTryOnMessage('Error during virtual try-on.');
    } finally {
      setTryOnLoading(false);
    }
  };

  if (!result) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.accent]}
          style={styles.emptyGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>🛍️</Text>
            </View>
            <Text style={styles.emptyTitle}>Ready to Shop?</Text>
            <Text style={styles.emptySubtitle}>
              Complete your body analysis to get personalized recommendations
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const renderProductCard = (product: {
    title: string;
    brand: string;
    size: string;
    price: string;
    originalPrice: string;
    discount: string;
    image: string;
    rating: string;
  }) => (
    <View style={styles.productCard} key={product.title}>
      <View style={styles.productImageContainer}>
        <Text style={styles.productImagePlaceholder}>{product.image}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{product.discount}% OFF</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>♡</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{product.brand}</Text>
        <Text style={styles.productTitle}>{product.title}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {product.rating}</Text>
          <Text style={styles.ratingCount}>(2.4K)</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
        </View>
        <Text style={styles.sizeText}>Your Size: {product.size}</Text>
      </View>
    </View>
  );

  const renderCategory = (title: string, icon: string) => (
    <TouchableOpacity style={styles.categoryCard} key={title}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{icon}</Text>
      </View>
      <Text style={styles.categoryTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.accent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Image source={require('@/assets/images/icon.png')} style={styles.headerLogo} />
              <View style={styles.headerText}>
                <Text style={styles.welcomeText}>Spark Style</Text>
                <Text style={styles.headerSubtitle}>Your Perfect Fit Store</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerButtonText}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Text style={styles.headerButtonText}>🛒</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.measurementBanner}>
            <LinearGradient
              colors={[Colors.light.secondary, '#0FBF9F']}
              style={styles.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerIcon}>
                  <Text style={styles.bannerEmoji}>📐</Text>
                </View>
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>Your Measurements Ready!</Text>
                  <Text style={styles.bannerSubtitle}>AI-powered sizing for perfect fit</Text>
                </View>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {renderCategory("Shirts", "👔")}
              {renderCategory("T-Shirts", "👕")}
              {renderCategory("Jeans", "👖")}
              {renderCategory("Jackets", "🧥")}
              {renderCategory("Shoes", "👟")}
              {renderCategory("Accessories", "⌚")}
            </ScrollView>
          </View>

          {/* Virtual Try-On Section */}
          <View style={styles.tryOnSection}>
            <Text style={styles.tryOnTitle}>👗 AI Virtual Try-On</Text>
            <Text style={styles.tryOnSubtitle}>See how you look in the latest styles! Upload or capture your photo and preview instantly.</Text>
            <View style={styles.tryOnActionsRow}>
              <TouchableOpacity style={styles.tryOnActionButton} onPress={() => handleTryOnImage(false)}>
                <Text style={styles.tryOnActionText}>Upload Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tryOnActionButton} onPress={() => handleTryOnImage(true)}>
                <Text style={styles.tryOnActionText}>Use Camera</Text>
              </TouchableOpacity>
            </View>
            {tryOnImage && (
              <View style={styles.tryOnPreviewRow}>
                <View style={styles.tryOnPreviewCol}>
                  <Text style={styles.tryOnPreviewLabel}>Your Photo</Text>
                  <Image source={{ uri: tryOnImage }} style={styles.tryOnUserImage} />
                </View>
                <View style={styles.tryOnPreviewCol}>
                  <Text style={styles.tryOnPreviewLabel}>Try-On Result</Text>
                  {tryOnLoading ? (
                    <View style={styles.tryOnLoadingBox}><ActivityIndicator size="large" color={Colors.light.primary} /></View>
                  ) : tryOnResult ? (
                    <Image source={{ uri: tryOnResult }} style={styles.tryOnResultImage} />
                  ) : (
                    <View style={styles.tryOnLoadingBox}><Text style={styles.tryOnPreviewPlaceholder}>Preview</Text></View>
                  )}
                </View>
              </View>
            )}
            {tryOnMessage && <Text style={styles.tryOnMessage}>{tryOnMessage}</Text>}
          </View>

          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>Based on your body measurements</Text>
            
            <View style={styles.productGrid}>
              {renderProductCard({
                title: "Slim Fit Casual Shirt",
                brand: "HIGHLANDER",
                size: "M",
                price: "899",
                originalPrice: "1799",
                discount: "50",
                image: "👔",
                rating: "4.2"
              })}
              {renderProductCard({
                title: "Regular Fit Jeans",
                brand: "Roadster",
                size: "32W x 32L",
                price: "1299",
                originalPrice: "2599",
                discount: "50",
                image: "👖",
                rating: "4.1"
              })}
              {renderProductCard({
                title: "Cotton Round Neck T-shirt",
                brand: "HRX by Hrithik Roshan",
                size: "M",
                price: "599",
                originalPrice: "999",
                discount: "40",
                image: "👕",
                rating: "4.3"
              })}
              {renderProductCard({
                title: "Bomber Jacket",
                brand: "Roadster",
                size: "M",
                price: "1999",
                originalPrice: "3999",
                discount: "50",
                image: "🧥",
                rating: "4.0"
              })}
            </View>
          </View>

          <View style={styles.measurementSection}>
            <Text style={styles.sectionTitle}>Your Measurements</Text>
            <View style={styles.measurementCard}>
              <View style={styles.measurementHeader}>
                <View style={styles.measurementIcon}>
                  <Text style={styles.measurementEmoji}>📏</Text>
                </View>
                <View style={styles.measurementHeaderText}>
                  <Text style={styles.measurementTitle}>Body Analysis Complete</Text>
                  <Text style={styles.measurementSubtitle}>Accuracy: 98.5%</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>✓ Verified</Text>
                </View>
              </View>
              
              <View style={styles.measurementGrid}>
                {Object.entries(result.average).map(([key, value]) => (
                  <View key={key} style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <Text style={styles.measurementValue}>{String(value)} cm</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Now</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>What&apos;s popular in your size</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
              <View style={styles.trendingCard}>
                <View style={styles.trendingImageContainer}>
                  <Text style={styles.trendingImage}>🔥</Text>
                </View>
                <Text style={styles.trendingTitle}>Festive Collection</Text>
                <Text style={styles.trendingSubtitle}>Up to 70% off</Text>
              </View>
              <View style={styles.trendingCard}>
                <View style={styles.trendingImageContainer}>
                  <Text style={styles.trendingImage}>⭐</Text>
                </View>
                <Text style={styles.trendingTitle}>Premium Brands</Text>
                <Text style={styles.trendingSubtitle}>Curated for you</Text>
              </View>
              <View style={styles.trendingCard}>
                <View style={styles.trendingImageContainer}>
                  <Text style={styles.trendingImage}>💎</Text>
                </View>
                <Text style={styles.trendingTitle}>New Arrivals</Text>
                <Text style={styles.trendingSubtitle}>Fresh styles</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },

  measurementBanner: {
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerGradient: {
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerEmoji: {
    fontSize: 24,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingLeft: 4,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },

  recommendationsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  productGrid: {
    gap: 12,
  },
  productCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImagePlaceholder: {
    fontSize: 48,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  productInfo: {
    padding: 12,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.muted,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.light.muted,
    textDecorationLine: 'line-through',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondary,
  },

  measurementSection: {
    marginBottom: 24,
  },
  measurementCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  measurementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  measurementEmoji: {
    fontSize: 24,
  },
  measurementHeaderText: {
    flex: 1,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  measurementSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  confidenceBadge: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  measurementItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 12,
    minWidth: '30%',
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 4,
    textAlign: 'center',
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },

  trendingSection: {
    marginBottom: 24,
  },
  trendingContainer: {
    paddingLeft: 4,
  },
  trendingCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  trendingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  trendingImage: {
    fontSize: 32,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  trendingSubtitle: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
  },

  tryOnSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  tryOnTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  tryOnSubtitle: {
    fontSize: 15,
    color: Colors.light.muted,
    marginBottom: 18,
    textAlign: 'center',
  },
  tryOnActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 18,
  },
  tryOnActionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tryOnActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  tryOnPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 10,
  },
  tryOnPreviewCol: {
    alignItems: 'center',
    flex: 1,
  },
  tryOnPreviewLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 6,
    textAlign: 'center',
  },
  tryOnUserImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    resizeMode: 'cover',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tryOnResultImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    resizeMode: 'cover',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  tryOnLoadingBox: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 4,
  },
  tryOnPreviewPlaceholder: {
    color: Colors.light.muted,
    fontSize: 15,
  },
  tryOnMessage: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});