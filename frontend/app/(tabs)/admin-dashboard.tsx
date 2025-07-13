import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import StepIndicator from 'react-native-step-indicator';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const funnelSteps: { label: string; icon: IconName; color: string }[] = [
  { label: 'QR Scan', icon: 'qrcode-scan', color: Colors.light.primary },
  { label: 'Try-On', icon: 'tshirt-crew', color: Colors.light.secondary },
  { label: 'Add to Cart', icon: 'cart-plus', color: Colors.light.accent },
  { label: 'Purchase', icon: 'credit-card-check', color: Colors.light.success },
];
const funnelRates = ['121', '68%', '44%', '20%']; // Example demo conversion rates

const stepLabels = funnelSteps.map(s => s.label);

const customStyles = {
  stepIndicatorSize: 38,
  currentStepIndicatorSize: 44,
  separatorStrokeWidth: 3,
  currentStepStrokeWidth: 4,
  stepStrokeCurrentColor: Colors.light.primary,
  stepStrokeWidth: 3,
  stepStrokeFinishedColor: Colors.light.primary,
  stepStrokeUnFinishedColor: Colors.light.muted,
  separatorFinishedColor: Colors.light.primary,
  separatorUnFinishedColor: Colors.light.muted,
  stepIndicatorFinishedColor: Colors.light.primary,
  stepIndicatorUnFinishedColor: Colors.light.surface,
  stepIndicatorCurrentColor: Colors.light.secondary,
  stepIndicatorLabelFontSize: 0,
  currentStepIndicatorLabelFontSize: 0,
  labelColor: Colors.light.muted,
  labelSize: 13,
  currentStepLabelColor: Colors.light.primary,
  stepIndicatorLabelCurrentColor: 'transparent',
  stepIndicatorLabelFinishedColor: 'transparent',
  stepIndicatorLabelUnFinishedColor: 'transparent',
};

const keyMetrics = [
  { label: 'Try-On to Recommendation', value: '68%', key: 'conversion', icon: 'swap-horizontal', color: Colors.light.primary },
  { label: 'Most Tried-On Product', value: 'Slim Fit Shirt', count: 124, key: 'mostTried', icon: 'tshirt-crew', color: Colors.light.secondary },
  { label: 'Most Added to Cart', value: 'Regular Fit Jeans', count: 87, key: 'mostCart', icon: 'cart', color: Colors.light.accent },
  { label: 'Unique Users Today', value: '312', key: 'usersToday', icon: 'account-group', color: Colors.light.success },
  { label: 'Unique Users This Week', value: '1,245', key: 'usersWeek', icon: 'calendar-week', color: Colors.light.warning },
];

const productMetrics: any[] = [
  { name: 'Slim Fit Shirt', qr: 200, tryon: 124, rec: 110, cart: 60, purchases: 30, icon: 'tshirt-crew' },
  { name: 'Regular Fit Jeans', qr: 180, tryon: 90, rec: 80, cart: 87, purchases: 40, icon: 'tshirt-crew' },
  { name: 'Cotton T-shirt', qr: 150, tryon: 70, rec: 60, cart: 30, purchases: 15, icon: 'tshirt-crew-outline' },
  { name: 'Denim Jacket', qr: 120, tryon: 60, rec: 55, cart: 25, purchases: 10, icon: 'tshirt-crew' },
  { name: 'Sneakers', qr: 100, tryon: 50, rec: 45, cart: 20, purchases: 8, icon: 'tshirt-crew' },
  { name: 'Formal Trousers', qr: 90, tryon: 40, rec: 35, cart: 15, purchases: 5, icon: 'tshirt-crew' },
  { name: 'Hoodie', qr: 80, tryon: 38, rec: 30, cart: 12, purchases: 4, icon: 'tshirt-crew' },
  { name: 'Cap', qr: 60, tryon: 25, rec: 20, cart: 8, purchases: 2, icon: 'tshirt-crew' },
  { name: 'Socks', qr: 50, tryon: 20, rec: 15, cart: 6, purchases: 1, icon: 'tshirt-crew' },
  { name: 'Leather Belt', qr: 40, tryon: 15, rec: 10, cart: 4, purchases: 1, icon: 'tshirt-crew' },
];

const timeRanges = ['Today', 'This Week', 'This Month'];

export default function AdminDashboard() {
  const [selectedTime, setSelectedTime] = useState('Today');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    name: string;
    qr: number;
    tryon: number;
    rec: number;
    cart: number;
    purchases: number;
    icon: string;
  } | null>(null);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeProductModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  // Find the top product by purchases for highlighting
  const topProductName = productMetrics.reduce((max, p) => (p.purchases > max.purchases ? p : max), productMetrics[0]).name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.pageTitle}>Admin Dashboard</ThemedText>

      {/* Funnel Overview */}
      <ThemedView style={styles.funnelCard}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Virtual Try-On Funnel</ThemedText>
        <View style={styles.funnelStepperFullWidth}>
          <StepIndicator
            customStyles={customStyles}
            currentPosition={3} // All steps completed for demo
            stepCount={funnelSteps.length}
            labels={stepLabels}
            renderStepIndicator={({ position, stepStatus }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={funnelSteps[position].icon as any}
                  size={28}
                  color={stepStatus === 'finished' || stepStatus === 'current' ? '#fff' : Colors.light.primary}
                />
              </View>
            )}
            renderLabel={({ position, label, currentPosition }) => (
              <View style={{ alignItems: 'center' }}>
                <ThemedText style={[
                  styles.funnelStepModernLabelLarge,
                  position === currentPosition && { color: Colors.light.primary, fontWeight: 'bold' },
                ]}>{label}</ThemedText>
                {position < funnelRates.length && (
                  <View style={styles.funnelRatePill}>
                    <ThemedText style={styles.funnelRatePillText}>{funnelRates[position]}</ThemedText>
                  </View>
                )}
              </View>
            )}
          />
        </View>
      </ThemedView>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {keyMetrics.map((metric) => (
          <ThemedView key={metric.key} style={[styles.metricCard, { backgroundColor: metric.color + '22' }]}> 
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name={metric.icon as any} size={28} color={metric.color} />
            </View>
            <ThemedText type="subtitle" style={styles.metricLabel}>{metric.label}</ThemedText>
            <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
            {metric.count !== undefined && (
              <ThemedText style={styles.metricCount}>{metric.count} times</ThemedText>
            )}
          </ThemedView>
        ))}
      </View>

      {/* Product Metrics Table */}
      <View style={styles.horizontalScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedView style={styles.tableCard}>
            <View style={styles.tableHeaderRowModern}>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>Product</ThemedText>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>QR</ThemedText>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>Try-Ons</ThemedText>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>Rec Clicks</ThemedText>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>Cart</ThemedText>
              <ThemedText type="subtitle" style={styles.tableHeaderModern}>Purchases</ThemedText>
            </View>
            {productMetrics.map((row: any, idx: number) => {
              const isTop = row.name === topProductName;
              return (
                <TouchableOpacity
                  key={row.name}
                  style={[styles.tableRowModern, idx % 2 === 0 ? styles.tableRowAltModern : null, isTop && styles.tableRowTopProduct]}
                  onPress={() => openProductModal(row)}
                  activeOpacity={0.92}
                >
                  <View style={styles.tableProductCellModern}>
                    <View style={[styles.productIconCircle, isTop && styles.productIconCircleTop]}>
                      <MaterialCommunityIcons name={row.icon as any} size={20} color={'#fff'} />
                    </View>
                    <ThemedText style={[styles.tableCellModern, styles.productNameCell, isTop && styles.productNameCellTop]}>{row.name}</ThemedText>
                  </View>
                  <ThemedText style={[styles.tableCellModern, styles.metricCell]}>{row.qr}</ThemedText>
                  <ThemedText style={[styles.tableCellModern, styles.metricCell]}>{row.tryon}</ThemedText>
                  <ThemedText style={[styles.tableCellModern, styles.metricCell]}>{row.rec}</ThemedText>
                  <ThemedText style={[styles.tableCellModern, styles.metricCell]}>{row.cart}</ThemedText>
                  <ThemedText style={[styles.tableCellModern, styles.metricCell, isTop && styles.metricCellTop]}>{row.purchases}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </ThemedView>
        </ScrollView>
      </View>

      {/* Product Analytics Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeProductModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Product Analytics</ThemedText>
              <TouchableOpacity onPress={closeProductModal} style={styles.modalCloseBtn}>
                <Ionicons name="close-circle" size={28} color={Colors.light.error} />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <>
                <View style={styles.modalProductIconWrap}>
                  <MaterialCommunityIcons name={selectedProduct.icon as any} size={32} color={Colors.light.primary} />
                </View>
                <ThemedText style={styles.modalProductName}>{selectedProduct.name}</ThemedText>
                <View style={styles.modalMetricRow}><ThemedText>QR Scans:</ThemedText><ThemedText style={styles.modalMetricValue}>{selectedProduct.qr}</ThemedText></View>
                <View style={styles.modalMetricRow}><ThemedText>Try-Ons:</ThemedText><ThemedText style={styles.modalMetricValue}>{selectedProduct.tryon}</ThemedText></View>
                <View style={styles.modalMetricRow}><ThemedText>Recommendation Clicks:</ThemedText><ThemedText style={styles.modalMetricValue}>{selectedProduct.rec}</ThemedText></View>
                <View style={styles.modalMetricRow}><ThemedText>Add to Cart:</ThemedText><ThemedText style={styles.modalMetricValue}>{selectedProduct.cart}</ThemedText></View>
                <View style={styles.modalMetricRow}><ThemedText>Purchases:</ThemedText><ThemedText style={styles.modalMetricValue}>{selectedProduct.purchases}</ThemedText></View>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
    gap: 28,
  },
  pageTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    fontSize: 28,
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.light.text,
  },
  funnelCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  funnelStepperFullWidth: {
    width: width - 40, // 20px padding on each side
    alignSelf: 'center',
    marginTop: 18,
  },
  funnelStepModern: {
    alignItems: 'center',
    width: 80,
  },
  funnelStepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  funnelStepNumberWrap: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  funnelStepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  funnelStepModernLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 2,
  },
  funnelStepModernLabelLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 2,
  },
  funnelConnectorModernWrap: {
    alignItems: 'center',
    width: 48,
    marginHorizontal: -4,
  },
  funnelConnectorModern: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.muted,
    borderRadius: 2,
    marginBottom: 2,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  funnelRatePill: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'center',
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  funnelRatePillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  metricCard: {
    borderRadius: 16,
    padding: 18,
    minWidth: width / 2.25,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  metricIconWrap: {
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  metricCount: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  tableCard: {
    minWidth: 800, // ensures horizontal scroll on small screens
    borderRadius: 22,
    padding: 0,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 5,
  },
  tableHeaderRowModern: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeaderModern: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tableRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    width: '100%', // keep as is or set to undefined for flexibility
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    transitionDuration: '150ms',
  },
  tableRowAltModern: {
    backgroundColor: Colors.light.surface,
  },
  tableRowTopProduct: {
    backgroundColor: Colors.light.secondary + '22',
    borderLeftWidth: 5,
    borderLeftColor: Colors.light.secondary,
    zIndex: 2,
  },
  tableProductCellModern: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  productIconCircleTop: {
    backgroundColor: Colors.light.secondary,
  },
  tableCellModern: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  productNameCell: {
    textAlign: 'left',
    fontWeight: '700',
    fontSize: 15,
    color: Colors.light.text,
  },
  productNameCellTop: {
    color: Colors.light.secondary,
    fontWeight: '800',
    fontSize: 16,
  },
  metricCell: {
    fontWeight: '700',
    fontSize: 16,
    color: Colors.light.primary,
  },
  metricCellTop: {
    color: Colors.light.secondary,
    fontWeight: '900',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 22,
    padding: 28,
    width: width * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: Colors.light.primary,
  },
  modalCloseBtn: {
    marginLeft: 10,
  },
  modalProductIconWrap: {
    marginVertical: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  modalProductName: {
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 10,
    color: Colors.light.text,
  },
  modalMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 2,
  },
  modalMetricValue: {
    fontWeight: '700',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  horizontalScrollWrapper: {
    width: '100%',
    marginBottom: 18,
  },
}); 