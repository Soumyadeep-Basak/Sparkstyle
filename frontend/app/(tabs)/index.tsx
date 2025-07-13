import React, {
  useState,
  useCallback,
  createContext,
  useContext,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/Api';
import { useAuth } from '../../contexts/auth-context';

const { width, height: screenHeight } = Dimensions.get('window');

/*****************************************************************************************
 * Context helpers
 *****************************************************************************************/
export const AnalysisResultContext = createContext<{
  result: any;
  setResult: React.Dispatch<React.SetStateAction<any>>;
}>({ result: null, setResult: () => {} });
export const useAnalysisResult = () => useContext(AnalysisResultContext);

/*****************************************************************************************
 * Utility helpers
 *****************************************************************************************/
enum ImageMime {
  jpeg = 'jpeg',
  png = 'png',
  webp = 'webp',
  heic = 'heic',
  heif = 'heif',
}

const normaliseExt = (ext: string | undefined): ImageMime => {
  switch ((ext || '').toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return ImageMime.jpeg;
    case 'png':
      return ImageMime.png;
    case 'webp':
      return ImageMime.webp;
    case 'heic':
      return ImageMime.heic;
    case 'heif':
      return ImageMime.heif;
    default:
      return ImageMime.jpeg;
  }
};

const stabiliseUri = async (uri: string): Promise<string> => {
  if (Platform.OS === 'ios') return uri;
  try {
    const ext = uri.split('.').pop();
    const newPath = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  } catch {
    return uri;
  }
};

/*****************************************************************************************
 * Hook for full‑body validation
 *****************************************************************************************/
interface Validator {
  validating: boolean;
  validate: (uri: string) => Promise<boolean>;
}

const useFullBodyValidator = (kind: 'front' | 'side'): Validator => {
  const [validating, setValidating] = useState(false);

  const validate = useCallback(
    async (rawUri: string): Promise<boolean> => {
      if (validating) return false;
      setValidating(true);
      try {
        // Use stabiliseUri for Android to ensure file accessibility
        const uri = await stabiliseUri(rawUri);
        const ext = uri.split('.').pop() || 'jpg';
        const fd = new FormData();
        fd.append('image', {
          uri,
          name: `${kind}_validation_${Date.now()}.${ext}`,
          type: `image/${ext}`,
        } as any);
        // Debug logging
        console.log('Validating image for fullbody detection:', { kind, uri, ext });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);

        const res = await fetch(`${API_BASE_URL}/api/body-measure/detect-fullbody`, {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
        }

        const data = (await res.json()) as { full_body?: boolean; message?: string };
        if (!data?.full_body) {
          Alert.alert(
            'Invalid Image',
            data.message ||
              'Please select a clear full‑body image showing the entire person.'
          );
          return false;
        }
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          Alert.alert('Timeout', 'Validation request timed‑out, please retry.');
        } else {
          Alert.alert('Network', err.message || 'Request failed');
        }
        return false;
      } finally {
        setValidating(false);
      }
    },
    [kind, validating]
  );

  return { validating, validate };
};

/*****************************************************************************************
 * Main component
 *****************************************************************************************/
export default function OnboardingScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);

  const frontValidator = useFullBodyValidator('front');
  const sideValidator = useFullBodyValidator('side');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();
  const { signup, login, user } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const pickFromLibrary = useCallback(
    async (kind: 'front' | 'side') => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission denied', 'Media‑library access is required.');
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        const ok = await (kind === 'front'
          ? frontValidator.validate(uri)
          : sideValidator.validate(uri));
        if (ok) {
          if (kind === 'front') {
            setFrontImage(uri);
          } else {
            setSideImage(uri);
          }
        }
      }
    },
    [frontValidator, sideValidator]
  );

  const takePhoto = useCallback(
    async (kind: 'front' | 'side') => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission denied', 'Camera access is required.');
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        const ok = await (kind === 'front'
          ? frontValidator.validate(uri)
          : sideValidator.validate(uri));
        if (ok) {
          if (kind === 'front') {
            setFrontImage(uri);
          } else {
            setSideImage(uri);
          }
        }
      }
    },
    [frontValidator, sideValidator]
  );

  const handleSignup = async () => {
    if (!name || !email || !password) return;
    setAuthLoading(true);
    try {
      await signup(name, email, password);
      setStep(2); // Proceed to image upload after successful signup/login
    } catch (err: any) {
      Alert.alert('Signup/Login failed', err.message || 'Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnalyse = useCallback(async () => {
    if (!frontImage || !sideImage || !height) {
      return Alert.alert('Missing info', 'Please complete all mandatory fields.');
    }
    try {
      setLoading(true);
      const fd = new FormData();
      const pushFile = (uri: string, field: 'front' | 'side') => {
        const ext = normaliseExt(uri.split('.').pop());
        fd.append(field, {
          uri,
          name: `${field}_${Date.now()}.${ext}`, // Add timestamp to prevent filename collisions
          type: `image/${ext}`,
        } as any);
      };
      pushFile(frontImage, 'front');
      pushFile(sideImage, 'side');
      fd.append('height', height);
      if (weight) fd.append('weight', weight);
      fd.append('gender', 'other');
      if (user && user.id) {
        fd.append('user_id', String(user.id));
      }
      
      // Add timeout for the API call
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000); // 60 second timeout
      
      console.log('Starting body measurement analysis...');
      const res = await fetch(`${API_BASE_URL}/api/body-measure/predict-avg`, {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      
      console.log('Analysis completed successfully');
      setResult(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      if (err.name === 'AbortError') {
        Alert.alert('Request timeout', 'The analysis request took too long. Please try again.');
      } else {
        Alert.alert('Analysis failed', err.message || 'Server error');
      }
      setLoading(false);
    }
  }, [frontImage, sideImage, height, weight, user]);

  const renderWelcomeStep = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.welcomeCard}>
        <View style={styles.iconRow}>
          <View style={styles.featureIcon}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <View style={styles.featureIcon}>
            <Text style={styles.iconText}>📐</Text>
          </View>
          <View style={styles.featureIcon}>
            <Text style={styles.iconText}>🛍️</Text>
          </View>
        </View>
        
        <Text style={styles.welcomeTitle}>Find Your Perfect Fit</Text>
        <Text style={styles.welcomeDescription}>
          Get personalized clothing recommendations using AI-powered body analysis.
        </Text>

        <View style={styles.authToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, !showLogin && styles.activeToggle]} 
            onPress={() => setShowLogin(false)}
          >
            <Text style={[styles.toggleText, !showLogin && styles.activeToggleText]}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, showLogin && styles.activeToggle]} 
            onPress={() => setShowLogin(true)}
          >
            <Text style={[styles.toggleText, showLogin && styles.activeToggleText]}>Login</Text>
          </TouchableOpacity>
        </View>

        {showLogin ? (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="Enter your email"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#B0B8C4"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="Enter your password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#B0B8C4"
              />
            </View>
            <TouchableOpacity
              style={[styles.premiumButton, !(loginEmail && loginPassword) && styles.disabledButton]}
              disabled={!(loginEmail && loginPassword) || loginLoading}
              onPress={async () => {
                setLoginLoading(true);
                try {
                  await login(loginEmail, loginPassword);
                  setStep(2);
                } catch (err: any) {
                  Alert.alert('Login failed', err.message || 'Please try again.');
                } finally {
                  setLoginLoading(false);
                }
              }}
            >
              <LinearGradient
                colors={loginEmail && loginPassword ? ['#4ECDC4', '#45B7D1'] : ['#E5E7EB', '#E5E7EB']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, !(loginEmail && loginPassword) && styles.disabledButtonText]}>
                    Login
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#B0B8C4"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#B0B8C4"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#B0B8C4"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.premiumButton, !(name && email && password) && styles.disabledButton]}
              disabled={!(name && email && password) || authLoading}
              onPress={handleSignup}
            >
              <LinearGradient
                colors={name && email && password ? ['#FF6B6B', '#FF8E53'] : ['#E5E7EB', '#E5E7EB']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, !(name && email && password) && styles.disabledButtonText]}>
                    Sign Up & Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderImageStep = (
    stepNumber: number,
    title: string,
    description: string,
    imageUri: string | null,
    kind: 'front' | 'side',
    validator: Validator,
    nextAction: () => void
  ) => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.stepHeader}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>{stepNumber}</Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>

      <View style={styles.imageCard}>
        <TouchableOpacity
          style={styles.premiumImagePicker}
          onPress={() => pickFromLibrary(kind)}
          disabled={validator.validating}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.selectedImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholderContainer}>
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>📸</Text>
              </View>
              <Text style={styles.uploadText}>Tap to upload image</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB</Text>
            </View>
          )}
          
          {validator.validating && (
            <View style={styles.validationOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.validationText}>Analyzing image...</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, validator.validating && styles.disabledButton]}
            onPress={() => takePhoto(kind)}
            disabled={validator.validating}
          >
            <Text style={styles.actionButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, validator.validating && styles.disabledButton]}
            onPress={() => pickFromLibrary(kind)}
            disabled={validator.validating}
          >
            <Text style={styles.actionButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={nextAction}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFinalStep = () => (
    <View style={styles.finalStepContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.stepHeader}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>4</Text>
        </View>
        <Text style={styles.stepTitle}>Body Measurements</Text>
        <Text style={styles.stepDescription}>Help us get your perfect fit</Text>
      </View>

      <View style={styles.finalCard}>
        {result ? (
          <View style={styles.resultContainer}>
            <LinearGradient
              colors={['#4ECDC4', '#45B7D1']}
              style={styles.resultHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.resultHeaderText}>Your Perfect Fit</Text>
            </LinearGradient>
            
            <View style={styles.resultContent}>
              <View style={styles.sizeContainer}>
                <Text style={styles.sizeLabel}>RECOMMENDED SIZE</Text>
                <Text style={styles.sizeValue}>XL</Text>
                <Text style={styles.sizePerfect}>Perfect Match!</Text>
              </View>
              
              <View style={styles.measurementsContainer}>
                <View style={styles.measurementItem}>
                  <View style={styles.measurementIconContainer}>
                    <Text style={styles.measurementIcon}>💪</Text>
                  </View>
                  <Text style={styles.measurementLabel}>Shoulder</Text>
                  <Text style={styles.measurementValue}>
                    {result.shoulder_in ? `${result.shoulder_in.toFixed(1)}″` : '- -'}
                  </Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <View style={styles.measurementIconContainer}>
                    <Text style={styles.measurementIcon}>👕</Text>
                  </View>
                  <Text style={styles.measurementLabel}>Chest</Text>
                  <Text style={styles.measurementValue}>
                    {result.chest_in ? `${result.chest_in.toFixed(1)}″` : '- -'}
                  </Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <View style={styles.measurementIconContainer}>
                    <Text style={styles.measurementIcon}>⏱️</Text>
                  </View>
                  <Text style={styles.measurementLabel}>Waist</Text>
                  <Text style={styles.measurementValue}>
                    {result.waist_in ? `${result.waist_in.toFixed(1)}″` : '- -'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.viewAllButton} onPress={() => Alert.alert('All Measurements', JSON.stringify(result, null, 2))}>
                <Text style={styles.viewAllButtonText}>View All Measurements</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.shopNowButton}
                onPress={() => router.navigate("/(tabs)/store")}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Shop Now With Your Size</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {sideImage && (
              <View style={styles.selectedImagePreview}>
                <Image source={{ uri: sideImage }} style={styles.previewImage} />
                <Text style={styles.imageLabel}>Side View ✓</Text>
              </View>
            )}

            <View style={styles.measurementInputs}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Height (cm) *</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="Enter height in cm"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                  placeholderTextColor="#B0B8C4"
                />
              </View>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="Enter weight (optional)"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                  placeholderTextColor="#B0B8C4"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.premiumButton,
                styles.analyzeButton,
                (!(sideImage && height) || loading) && styles.disabledButton
              ]}
              disabled={!(sideImage && height) || loading}
              onPress={handleAnalyse}
            >
              <LinearGradient
                colors={
                  sideImage && height && !loading
                    ? ['#10B981', '#059669']
                    : ['#E5E7EB', '#E5E7EB']
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Analyzing...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.buttonText,
                    (!(sideImage && height) || loading) && styles.disabledButtonText
                  ]}>
                    ✨ Get My Recommendations
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <AnalysisResultContext.Provider value={{ result, setResult }}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderWelcomeStep()}
          {step === 2 && renderImageStep(
            1,
            "Front View Photo",
            "Stand straight, arms at your sides, facing the camera",
            frontImage,
            'front',
            frontValidator,
            () => setStep(3)
          )}
          {step === 3 && renderImageStep(
            2,
            "Side View Photo",
            "Turn to your side, arms at your sides, profile view",
            sideImage,
            'side',
            sideValidator,
            () => setStep(4)
          )}
          {step === 4 && renderFinalStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </AnalysisResultContext.Provider>
  );
}

/*****************************************************************************************
 * Premium Modern Styles
 *****************************************************************************************/
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    minHeight: screenHeight,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  premiumLogo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconText: {
    fontSize: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  premiumInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  premiumButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  stepHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  stepIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  imageCard: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  premiumImagePicker: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  imagePlaceholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 32,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  validationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  validationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  finalStepContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  finalCard: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  selectedImagePreview: {
    alignItems: 'center',
    marginBottom: 30,
  },
  previewImage: {
    width: 120,
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  measurementInputs: {
    marginBottom: 40,
  },
  analyzeButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultCard: {
    marginTop: 30,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 200,
  },
  resultScroll: {
    maxHeight: 140,
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#111827',
  },
  // New styles for measurement result UI
  resultContainer: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  resultHeaderGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeaderText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resultContent: {
    padding: 24,
  },
  sizeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sizeValue: {
    fontSize: 60,
    fontWeight: '800',
    color: '#FF6B6B',
    lineHeight: 70,
  },
  sizePerfect: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 6,
  },
  measurementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  measurementIcon: {
    fontSize: 24,
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  shopNowButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});