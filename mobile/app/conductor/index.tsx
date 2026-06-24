import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassCard, GlassButton, GlassInput, globalStyles } from '../../components/ui';
import { BASE_URL } from '../../config';

// Simple text icons
const IconScan = () => <Text style={{fontSize: 20}}>📷</Text>;
const IconIssue = () => <Text style={{fontSize: 20}}>➕</Text>;
const IconManifest = () => <Text style={{fontSize: 20}}>📋</Text>;
const IconHome = () => <Text style={{fontSize: 20}}>🏠</Text>;

export default function ConductorPOS() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Shift & Trips
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [shiftDetails, setShiftDetails] = useState({ tripId: '', route: '', fare: 500 });
  const [scannedPassengers, setScannedPassengers] = useState<any[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'issue' | 'history'>('home');
  
  // Camera & Scan
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [paxCount, setPaxCount] = useState(1);
  const [fares, setFares] = useState({ cash: 0, digital: 0 });

  const fetchData = async () => {
    try {
      const meRes = await fetch(`${BASE_URL}/api/auth/me`);
      const meData = await meRes.json();
      if (!meData.user) throw new Error('Not authenticated');
      setUser(meData.user);

      const tripsRes = await fetch(`${BASE_URL}/api/trips`);
      const tripsData = await tripsRes.json();
      setAvailableTrips(tripsData.trips?.filter((t: any) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load data. Please login again.');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    router.replace('/');
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert('Scanned Ticket!', `Data: ${data}`, [
      { text: 'Verify & Board', onPress: () => verifyTicket(data) },
      { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' }
    ]);
  };

  const verifyTicket = (data: string) => {
    // Mock verification
    setScannedPassengers(prev => [{ id: data.substring(0, 8), time: new Date().toLocaleTimeString(), seats: 'Unassigned' }, ...prev]);
    setScanned(false);
    Alert.alert('Success', 'Passenger Boarded!');
    setActiveTab('history');
  };

  const issueTicket = (method: 'CASH' | 'QR') => {
    const total = paxCount * shiftDetails.fare;
    if (method === 'CASH') setFares(p => ({ ...p, cash: p.cash + total }));
    if (method === 'QR') setFares(p => ({ ...p, digital: p.digital + total }));
    
    setScannedPassengers(prev => [{ id: 'WALK-IN', time: new Date().toLocaleTimeString(), seats: paxCount + ' Pax' }, ...prev]);
    Alert.alert('Ticket Issued', `Collected LKR ${total}`);
    setPaxCount(1);
    setActiveTab('history');
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  // ---- SHIFT START SCREEN ----
  if (!isShiftActive) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center' }]}>
        <GlassCard>
          <Text style={styles.viewHeader}>Start Your Shift</Text>
          <Text style={styles.viewSub}>Select your assigned route run</Text>

          {availableTrips.map(trip => (
            <TouchableOpacity 
              key={trip.id} 
              style={[styles.tripSelect, shiftDetails.tripId === trip.id && styles.tripSelectActive]}
              onPress={() => setShiftDetails({ tripId: trip.id, route: `${trip.pickup} ➜ ${trip.destination}`, fare: 500 })}
            >
              <Text style={styles.tripText}>{trip.pickup} ➜ {trip.destination}</Text>
              <Text style={styles.tripSub}>{trip.trackingNumber}</Text>
            </TouchableOpacity>
          ))}

          {availableTrips.length === 0 && (
            <Text style={{color: '#fff', textAlign: 'center', marginVertical: 20}}>No trips available.</Text>
          )}

          <GlassButton 
            title="Start Shift" 
            variant="success" 
            onPress={() => setIsShiftActive(true)}
            disabled={!shiftDetails.tripId}
            style={{ marginTop: 20 }}
          />
        </GlassCard>
      </View>
    );
  }

  // ---- MAIN POS INTERFACE ----
  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.headerText}>Conductor POS</Text>
          <Text style={globalStyles.subText}>{shiftDetails.route}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <View>
            <GlassCard style={{ marginBottom: 20 }}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.viewHeader}>Active Shift</Text>
                <View style={styles.statusBadge}><Text style={styles.statusText}>🟢 Active</Text></View>
              </View>
              <Text style={globalStyles.subText}>ID: {user?.id.substring(0,8).toUpperCase()}</Text>

              <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.label}>CASH IN HAND</Text>
                  <Text style={styles.amountText}>LKR {fares.cash}</Text>
                </View>
                <View>
                  <Text style={styles.label}>DIGITAL (QR)</Text>
                  <Text style={styles.amountText}>LKR {fares.digital}</Text>
                </View>
              </View>
            </GlassCard>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <GlassButton title="📷 Scan" onPress={() => setActiveTab('scan')} style={{flex: 1, marginRight: 5}} />
              <GlassButton title="➕ Issue" onPress={() => setActiveTab('issue')} style={{flex: 1, marginLeft: 5}} variant="secondary" />
            </View>
          </View>
        )}

        {/* SCANNER TAB */}
        {activeTab === 'scan' && (
          <View>
            <Text style={styles.viewHeader}>Scan Boarding Pass</Text>
            <Text style={globalStyles.subText}>Point camera at passenger's QR code</Text>
            
            <GlassCard style={{ marginTop: 20, alignItems: 'center', padding: 0, overflow: 'hidden' }}>
              {!permission ? (
                <View style={{padding: 20}}><ActivityIndicator /></View>
              ) : !permission.granted ? (
                <View style={{padding: 20}}>
                  <Text style={{color: '#fff', textAlign: 'center'}}>No camera access</Text>
                  <GlassButton title="Grant Permission" onPress={requestPermission} style={{marginTop: 10}}/>
                </View>
              ) : (
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  />
                  {scanned && (
                    <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
                      <Text style={{color: '#fff', fontWeight: 'bold'}}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </GlassCard>

            <View style={{marginTop: 20}}>
              <GlassButton title="Simulate Scan (Test)" variant="secondary" onPress={() => handleBarcodeScanned({data: 'TICKET-TEST-1234'})} />
            </View>
          </View>
        )}

        {/* ISSUE TICKET TAB */}
        {activeTab === 'issue' && (
          <View>
            <Text style={styles.viewHeader}>Issue Walk-in Ticket</Text>
            <GlassCard style={{ marginTop: 20 }}>
              <Text style={styles.label}>Number of Passengers</Text>
              <View style={styles.paxSelector}>
                <TouchableOpacity onPress={() => setPaxCount(Math.max(1, paxCount - 1))} style={styles.paxBtn}><Text style={styles.paxText}>-</Text></TouchableOpacity>
                <Text style={styles.paxValue}>{paxCount}</Text>
                <TouchableOpacity onPress={() => setPaxCount(paxCount + 1)} style={styles.paxBtn}><Text style={styles.paxText}>+</Text></TouchableOpacity>
              </View>

              <View style={styles.totalBox}>
                <Text style={{color: '#fff'}}>Total Fare</Text>
                <Text style={styles.totalText}>LKR {paxCount * shiftDetails.fare}</Text>
              </View>

              <GlassButton title="💵 Collect Cash" onPress={() => issueTicket('CASH')} variant="success" style={{marginTop: 20}} />
              <GlassButton title="📱 Generate LANKAQR" onPress={() => issueTicket('QR')} variant="primary" style={{marginTop: 10}} />
            </GlassCard>
          </View>
        )}

        {/* HISTORY / MANIFEST TAB */}
        {activeTab === 'history' && (
          <View>
            <Text style={styles.viewHeader}>Manifest</Text>
            <Text style={globalStyles.subText}>Boarded Passengers: {scannedPassengers.length}</Text>
            
            <View style={{ marginTop: 20 }}>
              {scannedPassengers.length === 0 ? (
                <GlassCard><Text style={{color: '#fff', textAlign: 'center'}}>No passengers boarded yet.</Text></GlassCard>
              ) : (
                scannedPassengers.map((p, i) => (
                  <GlassCard key={i} style={{ marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', padding: 15 }}>
                    <View>
                      <Text style={{color: '#fff', fontWeight: 'bold'}}>{p.id}</Text>
                      <Text style={{color: 'rgba(255,255,255,0.6)'}}>Seats: {p.seats}</Text>
                    </View>
                    <Text style={{color: '#10b981'}}>{p.time}</Text>
                  </GlassCard>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Custom Bottom Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navActive]} onPress={() => setActiveTab('home')}>
          <IconHome />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'scan' && styles.navActive]} onPress={() => setActiveTab('scan')}>
          <IconScan />
          <Text style={[styles.navText, activeTab === 'scan' && styles.navTextActive]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'issue' && styles.navActive]} onPress={() => setActiveTab('issue')}>
          <IconIssue />
          <Text style={[styles.navText, activeTab === 'issue' && styles.navTextActive]}>Issue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'history' && styles.navActive]} onPress={() => setActiveTab('history')}>
          <IconManifest />
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>Manifest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  viewHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  viewSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  tripSelect: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  tripSelectActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  tripText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tripSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
  },
  paxSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  paxBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paxText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  paxValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalText: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    flexDirection: 'row',
    borderRadius: 30,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'space-around',
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: 70,
  },
  navActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  navText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: 10,
    marginTop: 4,
  },
  navTextActive: {
    color: '#38bdf8',
  }
});
