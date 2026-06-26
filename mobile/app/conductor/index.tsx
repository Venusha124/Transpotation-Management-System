import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton, GlassInput, globalStyles } from '../../components/ui';
import { BASE_URL } from '../../config';

// Notifications config disabled for Android Expo Go SDK 53+
// import * as Notifications from 'expo-notifications';

const COMMON_STOPS = ['Kandy', 'Kurunegala', 'Colombo', 'Kadawatha', 'Kegalle', 'Galle', 'Matara'];

export default function ConductorPortal() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'scanner' | 'cash' | 'history'>('home');
  const [conductorProfile, setConductorProfile] = useState<any>(null);
  
  // Trip Selection
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  // Scanner State
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Cash POS State
  const [destination, setDestination] = useState('');
  const [showStopDropdown, setShowStopDropdown] = useState(false);
  const [paxCount, setPaxCount] = useState('1');
  const [cashCollected, setCashCollected] = useState(0);

  // Manifest Data
  const [manifest, setManifest] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const meRes = await fetch(`${BASE_URL}/api/auth/me`);
      const meData = await meRes.json();
      if (!meData.user) throw new Error('Not authenticated');
      setConductorProfile(meData.user);

      const resTrips = await fetch(`${BASE_URL}/api/trips`);
      const tripsData = await resTrips.json();
      setAvailableTrips(tripsData.trips || []);

      setCashCollected(1500);

    } catch (err) {
      Alert.alert('Error', 'Failed to load data.');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update manifest when active trip changes
  useEffect(() => {
    if (activeTripId && availableTrips.length > 0) {
      const trip = availableTrips.find(t => t.id === activeTripId);
      if (trip && trip.bookings) {
        const dynamicManifest = trip.bookings.map((b: any) => ({
          id: b.id.substring(0, 8),
          name: b.customer?.name || 'Customer',
          stop: b.destination,
          status: b.qrScanned ? 'Boarded' : 'Pending',
          type: b.paymentStatus === 'PAID' ? 'Online' : 'Cash'
        }));
        setManifest(dynamicManifest);
      } else {
        setManifest([]);
      }
    }
  }, [activeTripId, availableTrips]);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartShift = async (trip: any) => {
    setActiveTripId(trip.id);
    const now = new Date();
    // Notifications disabled for Expo Go
  };

  const handleEndShift = async () => {
    setActiveTripId(null);
    const now = new Date();
    // Notifications disabled for Expo Go
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    const ticketId = data.trim();
    const existingPaxIndex = manifest.findIndex(p => p.id === ticketId);
    
    if (existingPaxIndex >= 0) {
      if (manifest[existingPaxIndex].status === 'Boarded') {
        Alert.alert("Warning", `Ticket ${ticketId} has already been used!`);
      } else {
        const newManifest = [...manifest];
        newManifest[existingPaxIndex].status = 'Boarded';
        setManifest(newManifest);
        Alert.alert("✅ Verified!", `Passenger ${newManifest[existingPaxIndex].name} boarded successfully.`);
        
        // Push Notification Receipt
        const now = new Date();
        // Notifications disabled for Expo Go
      }
    } else {
      setManifest([{ id: ticketId.substring(0, 8), name: 'Scanned Pax', stop: 'Unknown', status: 'Boarded', type: 'Online' }, ...manifest]);
      Alert.alert("✅ Valid Ticket", `Ticket Data: ${data}`);
      
      const now = new Date();
      // Notifications disabled for Expo Go
    }
  };

  const handleCashCheckout = () => {
    const count = parseInt(paxCount);
    if (!destination || isNaN(count) || count < 1) {
      Alert.alert('Missing Info', 'Please enter a valid destination and number of passengers.');
      return;
    }

    const totalFare = count * 500;
    
    const newWalkIns = Array.from({ length: count }).map((_, i) => ({
      id: `WALK-${Math.floor(Math.random() * 10000)}`,
      name: `Walk-in Pax ${i + 1}`,
      stop: destination,
      status: 'Boarded',
      type: 'Cash'
    }));

    setManifest([...newWalkIns, ...manifest]);
    setCashCollected(prev => prev + totalFare);
    setDestination('');
    setPaxCount('1');
    Alert.alert('Payment Logged', `Collected LKR ${totalFare} for ${count} passenger(s) to ${destination}.`);

    // Push Notification Receipt
    const now = new Date();
    // Notifications disabled for Expo Go
  };

  const activeTrip = availableTrips.find(t => t.id === activeTripId);
  const completedTrips = availableTrips.filter(t => t.status === 'COMPLETED');
  const shiftTrips = availableTrips.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS');

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Conductor System...</Text>
      </LinearGradient>
    );
  }

  if (!activeTripId) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[globalStyles.container, { justifyContent: 'center' }]}>
        <GlassCard>
          <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'}}>Start Your Shift</Text>
          <Text style={{color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20}}>
            Select your assigned route run to begin boarding passengers.
          </Text>

          {shiftTrips.length === 0 ? (
            <Text style={{color: '#f87171', textAlign: 'center', marginBottom: 20}}>No Active Trips Available.</Text>
          ) : (
            shiftTrips.map(trip => (
              <TouchableOpacity 
                key={trip.id} 
                style={styles.tripSelectCard}
                onPress={() => handleStartShift(trip)}
              >
                <Text style={styles.tripText}>{trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}</Text>
                <Text style={styles.tripSubText}>{trip.trackingNumber} | {trip.vehicle?.number}</Text>
              </TouchableOpacity>
            ))
          )}

          <GlassButton title="Log Out" onPress={handleLogout} variant="secondary" style={{ marginTop: 20 }} />
        </GlassCard>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={globalStyles.container}>
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.headerText}>Conductor POS</Text>
          <Text style={globalStyles.subText}>{activeTrip?.pickup.split(',')[0]} ➜ {activeTrip?.destination.split(',')[0]}</Text>
        </View>
        <TouchableOpacity onPress={handleEndShift} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>End Shift</Text>
        </TouchableOpacity>
      </View>

      {activeTab !== 'scanner' && activeTab !== 'history' && (
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <GlassCard style={{flex: 1, marginRight: 10, alignItems: 'center'}}>
             <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold'}}>BOARDED</Text>
             <Text style={{color: '#34d399', fontSize: 28, fontWeight: '900'}}>{manifest.filter(p => p.status === 'Boarded').length}</Text>
          </GlassCard>
          <GlassCard style={{flex: 1, alignItems: 'center'}}>
             <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold'}}>PENDING</Text>
             <Text style={{color: '#f59e0b', fontSize: 28, fontWeight: '900'}}>{manifest.filter(p => p.status === 'Pending').length}</Text>
          </GlassCard>
        </View>
      )}

      {activeTab === 'home' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>PASSENGER MANIFEST</Text>
          {manifest.map((pax, index) => (
            <GlassCard key={index} style={{ marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderLeftWidth: 4, borderLeftColor: pax.type === 'Cash' ? '#f59e0b' : '#38bdf8' }}>
              <View>
                <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>{pax.name}</Text>
                <Text style={{color: 'rgba(255,255,255,0.5)', fontSize: 12}}>Drop-off: {pax.stop} | {pax.type}</Text>
              </View>
              <View style={[styles.statusBadge, pax.status === 'Boarded' ? styles.badgeSuccess : styles.badgePending]}>
                <Text style={{color: pax.status === 'Boarded' ? '#10b981' : '#f59e0b', fontSize: 12, fontWeight: 'bold'}}>{pax.status}</Text>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      ) : activeTab === 'scanner' ? (
        <View style={{ flex: 1, paddingBottom: 100 }}>
          <Text style={styles.sectionTitle}>SCAN DIGITAL TICKET</Text>
          <GlassCard style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
            {!permission ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#fff'}}>Requesting camera permission...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
                <Text style={{color: '#fff', textAlign: 'center', marginBottom: 20}}>We need your permission to show the camera</Text>
                <GlassButton title="Grant Permission" onPress={requestPermission} />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <CameraView 
                  style={{ flex: 1 }} 
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerReticle} />
                </View>
                {scanned && (
                  <View style={styles.scanAgainContainer}>
                    <GlassButton title="Tap to Scan Another Ticket" onPress={() => setScanned(false)} variant="primary" />
                  </View>
                )}
              </View>
            )}
          </GlassCard>
        </View>
      ) : activeTab === 'cash' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <GlassCard style={{ marginBottom: 20, alignItems: 'center' }}>
            <Text style={{color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 'bold'}}>TOTAL SHIFT CASH</Text>
            <Text style={{color: '#10b981', fontSize: 40, fontWeight: '900', marginVertical: 10}}>
              LKR {cashCollected.toLocaleString()}
            </Text>
            <Text style={{color: 'rgba(255,255,255,0.5)', fontSize: 12}}>Must be handed to depot upon arrival.</Text>
          </GlassCard>

          <Text style={styles.sectionTitle}>ISSUE NEW TICKET</Text>
          <GlassCard style={{ marginBottom: 20 }}>
            <View style={{ marginBottom: 15, zIndex: 50 }}>
              <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 'bold', marginBottom: 8}}>Destination Stop</Text>
              
              <TouchableOpacity 
                style={styles.dropdownBtn}
                onPress={() => setShowStopDropdown(!showStopDropdown)}
              >
                <Text style={{color: destination ? '#fff' : 'rgba(255,255,255,0.5)'}}>
                  {destination || 'Select Destination Stop...'}
                </Text>
                <Text style={{color: '#fff'}}>▼</Text>
              </TouchableOpacity>

              {showStopDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                    {COMMON_STOPS.map(stop => (
                      <TouchableOpacity 
                        key={stop} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setDestination(stop);
                          setShowStopDropdown(false);
                        }}
                      >
                        <Text style={{color: '#fff'}}>{stop}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 25, zIndex: 10 }}>
              <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 'bold', marginBottom: 8}}>Number of Passengers</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setPaxCount(prev => Math.max(1, parseInt(prev || '1') - 1).toString())} style={styles.counterBtn}>
                  <Text style={{color: '#fff', fontSize: 20}}>-</Text>
                </TouchableOpacity>
                <GlassInput 
                  value={paxCount}
                  onChangeText={setPaxCount}
                  keyboardType="numeric"
                  style={{ flex: 1, marginHorizontal: 15, textAlign: 'center', fontSize: 20 }}
                />
                <TouchableOpacity onPress={() => setPaxCount(prev => (parseInt(prev || '1') + 1).toString())} style={styles.counterBtn}>
                  <Text style={{color: '#fff', fontSize: 20}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 15, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
               <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>Total Fare</Text>
               <Text style={{color: '#38bdf8', fontSize: 24, fontWeight: 'bold'}}>LKR {(parseInt(paxCount || '0') * 500).toLocaleString()}</Text>
            </View>

            <GlassButton title="Log Cash & Print Ticket" variant="success" onPress={handleCashCheckout} />
          </GlassCard>
        </ScrollView>
      ) : activeTab === 'history' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>COMPLETED HISTORY</Text>
          {completedTrips.map(trip => (
            <GlassCard key={trip.id} style={{ marginBottom: 15, opacity: 0.8 }}>
              <Text style={styles.runTitle}>{trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}</Text>
              <Text style={{ color: '#10b981', marginTop: 5 }}>✅ Done</Text>
              <Text style={styles.runDetail}>{trip.trackingNumber} | {new Date(trip.endAt || trip.updatedAt).toLocaleDateString()}</Text>
            </GlassCard>
          ))}
          {completedTrips.length === 0 && (
            <Text style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20}}>No completed trips yet.</Text>
          )}
        </ScrollView>
      ) : null}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navActive]} onPress={() => setActiveTab('home')}>
          <Ionicons name="people-outline" size={24} color={activeTab === 'home' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Manifest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'scanner' && styles.navActive]} onPress={() => setActiveTab('scanner')}>
          <Ionicons name="qr-code-outline" size={24} color={activeTab === 'scanner' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'scanner' && styles.navTextActive]}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'cash' && styles.navActive]} onPress={() => setActiveTab('cash')}>
          <Ionicons name="cash-outline" size={24} color={activeTab === 'cash' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'cash' && styles.navTextActive]}>Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'history' && styles.navActive]} onPress={() => setActiveTab('history')}>
          <Ionicons name="list-outline" size={24} color={activeTab === 'history' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 8, borderRadius: 8 },
  logoutText: { color: '#f87171', fontWeight: 'bold' },
  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 10, marginTop: 10 },
  
  tripSelectCard: { backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', marginBottom: 10 },
  tripText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tripSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' },
  
  runTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  runDetail: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },

  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerReticle: { width: 250, height: 250, borderWidth: 2, borderColor: '#38bdf8', backgroundColor: 'transparent', borderRadius: 20 },
  scanAgainContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },

  dropdownBtn: { backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownList: { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: 12, marginTop: 5, position: 'absolute', top: 75, left: 0, right: 0, zIndex: 100 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },

  counterBtn: { backgroundColor: 'rgba(15, 23, 42, 0.8)', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },

  bottomNav: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'rgba(15, 23, 42, 0.95)', flexDirection: 'row', borderRadius: 30, padding: 8, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  navItem: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
  navActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  navText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 10, marginTop: 4 },
  navTextActive: { color: '#38bdf8' }
});
