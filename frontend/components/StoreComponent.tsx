import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const features = [
  {
    title: 'Virtual Try-On',
    icon: '🕶️',
    description: 'Try clothes virtually with AI-powered previews.'
  },
  {
    title: 'AI Recommendation',
    icon: '🤖',
    description: 'Get personalized outfit suggestions instantly.'
  },
  {
    title: 'Hassle-Free Shopping',
    icon: '🛒',
    description: 'Seamless, secure, and easy shopping experience.'
  },
  {
    title: 'AI Size Analysis',
    icon: '📏',
    description: 'Accurate sizing for the perfect fit every time.'
  },
];

export default function StoreComponent({ onExploreTryOn }: { onExploreTryOn?: () => void }) {
    const router = useRouter();
    const handleExploreTryOn = () => router.push('/tryon');
  
    return (
      <LinearGradient
        colors={["#FFDEE9", "#B5FFFC"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome to Spark Style Store</Text>
          <Text style={styles.heroSubtitle}>
            Discover the future of fashion shopping with AI and Virtual Try-On
          </Text>
          <TouchableOpacity style={styles.heroButton} onPress={handleExploreTryOn}>
            <LinearGradient
              colors={["#FF6B6B", "#FFD93D"]}
              style={styles.heroButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.heroButtonText}>Explore Virtual Try-On</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
  
        {/* Features Grid */}
        <View style={styles.featuresWrapper}>
          <View style={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <View key={feature.title} style={styles.featureBox}>
                <LinearGradient
                  colors={idx % 2 === 0 ? ["#43E97B", "#38F9D7"] : ["#F7971E", "#FFD200"]}
                  style={styles.featureGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      minHeight: '100%',
      paddingTop: 60,
      paddingBottom: 40,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    heroSection: {
      width: '90%',
      maxWidth: 720,
      alignItems: 'center',
      marginBottom: 50,
      paddingHorizontal: 20,
    },
    heroTitle: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#222',
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: 1.1,
    },
    heroSubtitle: {
      fontSize: 18,
      color: '#444',
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 26,
    },
    heroButton: {
      borderRadius: 30,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#FFD93D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
    heroButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 36,
      borderRadius: 30,
      alignItems: 'center',
    },
    heroButtonText: {
      color: '#222',
      fontWeight: 'bold',
      fontSize: 18,
      letterSpacing: 1.1,
    },
    featuresWrapper: {
      width: '100%',
      alignItems: 'center',
    },
    featuresGrid: {
      width: '90%',
      maxWidth: 800,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 20,
      columnGap: '4%',
    },
    featureBox: {
      width: '48%',
      borderRadius: 16,
      overflow: 'visible',
      elevation: 2,
      shadowColor: '#000',
    //   padding: 15,
    //   paddingTop: 30,
    //   paddingBottom: 30,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    featureGradient: {
      flex: 1,
      padding: 15,
      paddingTop: 10,
      paddingBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureIcon: {
      fontSize: 36,
      marginBottom: 10,
    },
    featureTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#222',
      marginBottom: 6,
      textAlign: 'center',
    },
    featureDesc: {
      fontSize: 14,
      color: '#333',
      textAlign: 'center',
      lineHeight: 20,
    },
  });
  