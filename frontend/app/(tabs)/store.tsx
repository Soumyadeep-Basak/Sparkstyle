import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useAnalysisResult } from './index';

export default function StoreScreen() {
  const { result } = useAnalysisResult();

  if (!result) {
    return (
      <View style={styles.container}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.text}>No analysis result yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.text}>Welcome to the Store!</Text>
      <Text style={styles.sectionTitle}>Averaged Results</Text>
      <View style={styles.resultBox}>
        {Object.entries(result.average).map(([key, value]) => (
          <Text key={key} style={styles.resultText}>
            {key}: <Text style={{ fontWeight: 'bold' }}>{value}</Text>
          </Text>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Raw Results</Text>
      <View style={styles.resultBox}>
        <Text style={styles.resultText}>Mediapipe: {JSON.stringify(result.mediapipe, null, 2)}</Text>
        <Text style={styles.resultText}>YOLO: {JSON.stringify(result.yolo, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 20,
  },
  text: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#0071ce',
  },
  resultBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
}); 