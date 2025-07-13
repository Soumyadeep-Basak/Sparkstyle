import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import React from 'react';


const demoImage = require('../../assets/images/suit.jpg');

export default function CartScreen() {
  return (
    <View style={styles.cartContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.primary} />
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.accent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.cartTitle}>Your Cart</Text>
        </View>
      </LinearGradient>
      <View style={styles.cartContent}>
        <View style={styles.cartItemCard}>
          <Image source={demoImage} style={styles.cartItemImage} />
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName}>Men&apos;s Suit Blue</Text>
            <Text style={styles.cartItemSize}>Size: XL</Text>
            <Text style={styles.cartItemQty}>Quantity: 1</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Checkout at Counter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    width: 320,
    maxWidth: '100%',
  },
  cartItemImage: {
    width: 80,
    height: 110,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  cartItemSize: {
    fontSize: 15,
    color: Colors.light.secondary,
    marginBottom: 4,
  },
  cartItemQty: {
    fontSize: 15,
    color: Colors.light.muted,
  },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 12,
    width: 320,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});