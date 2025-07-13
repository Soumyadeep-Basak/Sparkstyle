import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Modal, 
  Animated, 
  Dimensions
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

const SUIT_IMAGE = require('../../assets/images/suit.jpg');
const DEMO_IMAGE = require('../../assets/images/demo.png');
const DEMO2_IMAGE = require('../../assets/images/demo2.png');
const PROD_IMAGE = require('../../assets/images/prod.jpg');
const SIMI_IMAGES = [
  require('../../assets/images/simi1.png'),
  require('../../assets/images/simi2.png'),
  require('../../assets/images/simi3.png'),
];
const RECOM_IMAGES = [
  require('../../assets/images/recom4.jpg'),
  require('../../assets/images/recom2.jpg'),
  require('../../assets/images/recom3.jpg'),
  require('../../assets/images/recom1.jpg'),
];

// Mock data for similar products
const SIMILAR_PRODUCTS = [
  { id: 1, name: 'Grey Suut', price: 3099 },
  { id: 2, name: 'Black Suit', price: 2499 },
  { id: 3, name: 'Beige Jacket', price: 999 },
];

// Mock data for recommended products
const RECOMMENDED_PRODUCTS = [
  { id: 8, name: 'Blue Pants', price: 29.99 },
  { id: 6, name: 'White Shirt', price: 39.99 },
  { id: 7, name: 'Black Tie', price: 79.99 },
  { id: 5, name: 'Blue Shirt', price: 49.99 },
];

export default function TryOnScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanningAnimation, setScanningAnimation] = useState(false);
  const [analyzingProduct, setAnalyzingProduct] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<boolean>(false);
  const [recommendedModalVisible, setRecommendedModalVisible] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [showPerfectSize, setShowPerfectSize] = useState(false);
  const [mainResultImage, setMainResultImage] = useState(DEMO_IMAGE);
  // Add a state to track if analyzing from try button
  const [analyzingFromTry, setAnalyzingFromTry] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [compareAnalyzing, setCompareAnalyzing] = useState(false);
  const [compareResultVisible, setCompareResultVisible] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanningAnimation(true);
    setTimeout(() => {
      setScanningAnimation(false);
      setProduct({
        id: 1,
        name: "Men's 3 Piece Suit",
        description: "Navy Blue Formal",
        size: "XL",
        image: DEMO_IMAGE
      });
      setAnalyzingProduct(true);
      setTimeout(() => {
        setAnalyzingProduct(false);
        setTryOnResult(true);
        setShowPerfectSize(true);
        setTimeout(() => setShowPerfectSize(false), 2000);
      }, 3500); // Increased analyzing time to 3.5 seconds
    }, 2000);
  };

  const resetScanner = () => {
    setScanned(false);
    setScanningAnimation(false);
    setAnalyzingProduct(false);
    setProduct(null);
    setTryOnResult(false);
    setAddedToCart(false);
    setMainResultImage(DEMO_IMAGE);
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
    setCart(prev => [...prev, product]);
    Alert.alert("Success", "Product added to cart successfully!");
    showRecommendedProducts();
  };
  
  const showRecommendedProducts = () => {
    setRecommendedModalVisible(true);
    Animated.timing(bottomSheetAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const hideRecommendedProducts = () => {
    Animated.timing(bottomSheetAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRecommendedModalVisible(false);
    });
  };

  // Handler for Try button on product cards
  const handleTryProduct = () => {
    // If currently showing recommended products, switch back to similar products
    if (addedToCart) {
      setAddedToCart(false);
    }
    setAnalyzingFromTry(true);
    setTimeout(() => {
      setMainResultImage(DEMO2_IMAGE);
      setAnalyzingFromTry(false);
    }, 2500); // 2.5 seconds
  };

  // Handler for Compare Mode
  const handleCompareMode = () => {
    setCompareModalVisible(true);
    setCompareAnalyzing(true);
    setCompareResultVisible(false);
    setTimeout(() => {
      setCompareAnalyzing(false);
      setCompareResultVisible(true);
    }, 3500); // Increased to 3.5 seconds
  };
  const closeCompareModal = () => {
    setCompareModalVisible(false);
    setCompareAnalyzing(false);
    setCompareResultVisible(false);
  };


  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  if (tryOnResult) {
    const listData = addedToCart ? RECOMMENDED_PRODUCTS : SIMILAR_PRODUCTS;
    return (
      <View style={{ flex: 1, minHeight: screenHeight, backgroundColor: '#f8f9fa', paddingHorizontal: 12 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: screenHeight * 0.2, paddingTop: 8 }}>
            <View style={styles.resultContainer}>
              <View style={styles.tryonFrame}>
                {/* Show loader if analyzingFromTry, else show mainResultImage */}
                {analyzingFromTry ? (
                  <View style={[styles.scannerContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', height: 400 }]}> 
                    <Image source={PROD_IMAGE} style={{ width: 180, height: 240, borderRadius: 16, marginBottom: 10 }} resizeMode="contain" />
                    <LinearGradient
                      colors={["#4E54C8", "#8F94FB"]}
                      style={styles.analyzingGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <ActivityIndicator size="large" color="#FFD93D" />
                      <Text style={styles.analyzingText}>Analyzing with AI...</Text>
                    </LinearGradient>
                    {/* Show SUIT_IMAGE below the loader */}
                    {/* <Image source={SUIT_IMAGE} style={{ width: 120, height: 160, borderRadius: 12, marginTop: 16 }} resizeMode="contain" /> */}
                  </View>
                ) : (
                  <Image source={mainResultImage} style={styles.resultImage} resizeMode="cover" />
                )}
                {showPerfectSize && !analyzingFromTry && (
                  <View style={styles.sizePerfectBadge}>
                    <Text style={styles.sizePerfectText}>Size: Perfect!</Text>
                  </View>
                )}
              </View>
              <View style={styles.productDetailsContainer}>
                <Text style={styles.productTitle}>Men&apos;s 3 Piece Suit</Text>
                <Text style={styles.productDescription}>Navy Blue Formal</Text>
                <View style={styles.sizeRow}>
                  <Text style={styles.sizeLabel}>Size</Text>
                  <Text style={styles.sizeValue}>XL (analyzed by AI)</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>{addedToCart ? 'Recommended Products' : 'Similar Products'}</Text>
            </View>
          {/* Similar Products Carousel */}
          {!addedToCart && (
            <FlatList
              data={listData}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item, index }) => (
                <View style={{ width: 160, marginRight: 16, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <Image source={SIMI_IMAGES[index % SIMI_IMAGES.length]} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>{item.name}</Text>
                  <Text style={{ fontSize: 14, color: '#007AFF', fontWeight: '600' }}>₹{item.price}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={{ backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginRight: 0 }} onPress={handleTryProduct}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Try</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: '#FFD93D', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }} onPress={handleCompareMode}>
                      <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 14 }}>Compare</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
          {/* Recommended Products Carousel (if addedToCart) */}
          {addedToCart && (
            <FlatList
              data={listData}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item, index }) => (
                <View style={{ width: 160, marginRight: 16, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <Image source={RECOM_IMAGES[index % RECOM_IMAGES.length]} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={{ backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginRight: 0 }} onPress={handleTryProduct}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Try</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: '#FFD93D', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }} onPress={handleCompareMode}>
                      <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 14 }}>Compare</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </ScrollView>
        {/* Add to Cart button - only show if not addedToCart */}
        {!addedToCart && (
          <View style={{ marginTop: 30, marginBottom: 110, paddingHorizontal: 16 }}>
            <TouchableOpacity 
              style={{ borderRadius: 16, shadowColor: '#4E54C8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }} 
              onPress={handleAddToCart}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#43E97B', '#38F9D7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1.1 }}>
                  Add to Cart
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        <Modal
          transparent={true}
          visible={recommendedModalVisible}
          animationType="none"
          onRequestClose={hideRecommendedProducts}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={hideRecommendedProducts}
          />
          <Animated.View 
            style={[
              styles.recommendedContainer,
              {
                transform: [
                  {
                    translateY: bottomSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.recommendedHandle} />
            <Text style={styles.recommendedTitle}>Recommended For You</Text>
            <FlatList
              data={RECOMMENDED_PRODUCTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item, index }) => (
                <View style={{ width: 160, marginRight: 16, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <Image source={RECOM_IMAGES[index % RECOM_IMAGES.length]} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 4 }}>{item.name}</Text>
                </View>
              )}
            />
          </Animated.View>
        </Modal>
        {/* Compare Mode Modal */}
        <Modal
          transparent={true}
          visible={compareModalVisible}
          animationType="fade"
          onRequestClose={closeCompareModal}
        >
          <View style={styles.compareModalOverlay}>
            <View style={styles.compareModalContent}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>Compare Mode</Text>
              <View style={styles.compareImagesRow}>
                <View style={[styles.compareImageWrapper, compareResultVisible && styles.winningImageWrapper]}>
                  <Image source={SUIT_IMAGE} style={styles.compareImage} resizeMode="contain" />
                  {compareResultVisible && (
                    <Text style={styles.trophyBelow}>🏆</Text>
                  )}
                </View>
                <View style={styles.compareImageWrapper}>
                  <Image source={SIMI_IMAGES[0]} style={styles.compareImage} resizeMode="contain" />
                </View>
              </View>
              {compareAnalyzing && (
                <View style={{ marginTop: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#4E54C8" style={{ marginBottom: 10 }} />
                  <Text style={{ fontSize: 16, color: '#666', fontWeight: '500' }}>Analyzing the user data and product data...</Text>
                </View>
              )}
              {compareResultVisible && (
                <Text style={{ marginTop: 24, fontSize: 16, color: '#333', fontWeight: '600', textAlign: 'center' }}>
                  Based on the product data and your body data, the perfect attire will be the first image.
                </Text>
              )}
              <TouchableOpacity style={styles.compareCloseButton} onPress={closeCompareModal}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Virtual Try-On</Text>
      <Text style={styles.subtitle}>Scan a product QR code to try it on</Text>
      {/* Only show scanner if not analyzing */}
      {!analyzingProduct && (
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Scanning animation */}
          {scanningAnimation && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.scanningText}>Scanning QR Code...</Text>
            </View>
          )}
        </View>
      )}
      {/* Show suit image and analyzing overlay if analyzingProduct is true */}
      {analyzingProduct && !tryOnResult && (
        <View style={[styles.scannerContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}> 
          <Image source={PROD_IMAGE} style={{ width: 180, height: 240, borderRadius: 16, marginBottom: 10 }} resizeMode="contain" />
          <LinearGradient
            colors={["#4E54C8", "#8F94FB"]}
            style={styles.analyzingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ActivityIndicator size="large" color="#FFD93D" />
            <Text style={styles.analyzingText}>Analyzing with AI...</Text>
          </LinearGradient>
        </View>
      )}
      {/* Product display and analysis */}
      {product && !tryOnResult && !analyzingProduct && (
        <View style={styles.productCard}>
          <Image 
            source={DEMO_IMAGE} 
            style={styles.productImage} 
            resizeMode="cover" 
          />
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>₹{product.price}</Text>
          
          {analyzingProduct && (
            <View style={styles.analyzingOverlay}>
              <LinearGradient
                colors={["#4E54C8", "#8F94FB"]}
                style={styles.analyzingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ActivityIndicator size="large" color="#FFD93D" />
                <Text style={styles.analyzingText}>Analyzing with AI...</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      )}

      {scanned && !scanningAnimation && !product && (
        <TouchableOpacity style={styles.button} onPress={resetScanner}>
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartContainer: {
    marginTop: 20,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#eaf4ff',
    borderRadius: 12,
    padding: 10,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  cartList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 15,
  },
  cartImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  cartName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 70,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
    alignSelf: 'flex-start',
  },
  scannerContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: '#007AFF',
    position: 'relative',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productPrice: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // AI-inspired gradient background
    backgroundColor: 'rgba(72, 61, 139, 0.85)', // fallback
  },
  analyzingGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    color: '#FFD93D',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1.1,
    textShadowColor: '#222',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  tryonFrame: {
    width: '100%',
    height: 400,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(72, 61, 139, 0.5)',
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'linear-gradient(135deg, #4E54C8 0%, #8F94FB 100%)',
    shadowColor: '#4E54C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
  },
  sizePerfectBadge: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: '#4cd964',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sizePerfectText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  productDetailsContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 10,
  },
  sizeLabel: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sizeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  similarProductsContainer: {
    paddingVertical: 10,
  },
  similarProductItem: {
    marginRight: 15,
    width: 150,
  },
  similarProductImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarProductName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  similarProductPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 90,
    gap: 15,
  },
  button: {
    // backgroundColor: 'linear-gradient(90deg, #43E97B 0%, #38F9D7 100%)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#38F9D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#b2b2b2',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#dadad',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  recommendedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%',
  },
  recommendedHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginBottom: 15,
    alignSelf: 'center',
  },
  recommendedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  recommendedColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recommendedProductItem: {
    width: '48%',
    marginBottom: 15,
  },
  recommendedProductImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedProductImageFixed: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eaf4ff',
    alignSelf: 'center',
  },
  recommendedProductName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  recommendedProductPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  compareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  compareModalContent: {
    backgroundColor: '#f8fafd', // softer background
    borderRadius: 24,
    padding: 28,
    width: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  compareImagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 24,
  },
  compareImageWrapper: {
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 4,
  },
  winningImageWrapper: {
    borderWidth: 3,
    borderColor: '#FFD93D',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  trophyBelow: {
    marginTop: 8,
    fontSize: 32,
    textAlign: 'center',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  compareImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
    marginBottom: 0,
    borderWidth: 2,
    borderColor: '#eee',
  },
  trophyOverlay: {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: [{ translateX: -16 }],
    fontSize: 32,
    zIndex: 2,
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  compareCloseButton: {
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
});
