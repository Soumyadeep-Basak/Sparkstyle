import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { getProductById, tryOnWithProduct, API_BASE_URL } from '../../constants/Api';

export default function TryOnScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [userId] = useState(1);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);
    
    try {
      const productId = parseInt(data);
      if (isNaN(productId)) {
        Alert.alert('Invalid QR Code', 'QR code does not contain a valid product ID');
        setScanned(false);
        setLoading(false);
        return;
      }

      const productData = await getProductById(productId);
      setProduct(productData);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch product');
      setScanned(false);
      setLoading(false);
    }
  };

  const handleTryOn = async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      const imageUrl = await tryOnWithProduct(userId, product.id);
      setTryOnResult(imageUrl);
      setLoading(false);
    } catch (error) {
      Alert.alert('Try-On Error', error instanceof Error ? error.message : 'Try-on failed');
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setProduct(null);
    setTryOnResult(null);
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
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Try-On Result</Text>
          <Image source={{ uri: tryOnResult }} style={styles.resultImage} resizeMode="contain" />
          <TouchableOpacity style={styles.button} onPress={resetScanner}>
            <Text style={styles.buttonText}>Try Another Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (product) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.productContainer}>
          <Text style={styles.title}>Product Details</Text>
          <View style={styles.productCard}>
            {product.image && (
              <Image 
                source={{ uri: `${API_BASE_URL}/api/uploads/${product.image}` }} 
                style={styles.productImage} 
                resizeMode="cover" 
              />
            )}
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>
            {product.description && (
              <Text style={styles.productDescription}>{product.description}</Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing try-on...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleTryOn}>
                <Text style={styles.buttonText}>Try On This Product</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetScanner}>
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Scan Another QR Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Virtual Try-On</Text>
      <Text style={styles.subtitle}>Scan a product QR code to try it on</Text>
      
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      )}

      {scanned && !loading && (
        <TouchableOpacity style={styles.button} onPress={resetScanner}>
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  scannerContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  productContainer: {
    alignItems: 'center',
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
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultImage: {
    width: '100%',
    height: 400,
    marginBottom: 30,
    borderRadius: 12,
  },
});
