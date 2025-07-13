import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BODY_TYPES = [
  { label: 'Square', value: 'square', icon: '▭' },
  { label: 'Triangle', value: 'triangle', icon: '△' },
  { label: 'Trapezium', value: 'trapezium', icon: '⏃' },
  { label: 'Round', value: 'round', icon: '◯' },
  { label: 'V-Taper', value: 'v_taper', icon: '⏁' },
];

export default function BodyTypeStep({ value, onChange, onNext, onBack }: {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>Step 2 of 4</Text>
      <Text style={styles.title}>Help us create a delightful shopping experience for you</Text>
      <Text style={styles.subtitle}>Choose your body type</Text>
      <View style={styles.grid}>
        {BODY_TYPES.map((b) => (
          <TouchableOpacity
            key={b.value}
            style={[styles.box, value === b.value && styles.selectedBox]}
            onPress={() => onChange(b.value)}
          >
            <Text style={styles.icon}>{b.icon}</Text>
            <Text style={value === b.value ? styles.selectedLabel : styles.label}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, !value && styles.disabledButton]} onPress={onNext} disabled={!value}>
          <Text style={styles.nextText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  stepLabel: { color: '#E43F6F', fontWeight: '600', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  title: { fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#444', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 },
  box: { width: 110, height: 140, borderRadius: 12, margin: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8F8F8' },
  selectedBox: { borderColor: '#E43F6F', backgroundColor: '#FFF0F6' },
  icon: { fontSize: 38, marginBottom: 10 },
  label: { color: '#222', fontWeight: '500', fontSize: 15, textAlign: 'center' },
  selectedLabel: { color: '#E43F6F', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  backButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#fff' },
  backText: { color: '#222', fontWeight: 'bold' },
  nextButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#E43F6F' },
  nextText: { color: '#fff', fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#eee' },
}); 