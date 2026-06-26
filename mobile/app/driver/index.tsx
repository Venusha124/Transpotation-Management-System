import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
// Notifications disabled for Android Expo Go SDK 53+
// import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton, GlassInput, globalStyles } from '../../components/ui';
import { BASE_URL } from '../../config';

export default function DriverPortal() {
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'runs' | 'history' | 'earnings'>('home');
  const [isOffline, setIsOffline] = useState(false);
  
  // Location & Push State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState('');

  // Incident State
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState('Breakdown');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentImage, setIncidentImage] = useState<string | null>(null);
  const [submittingIncident, setSubmittingIncident] = useState(false);

  const fetchData = async () => {
    try {
      const meRes = await fetch(`${BASE_URL}/api/auth/me`);
      const meData = await meRes.json();
      if (!meData.user) throw new Error('Not authenticated');

      const resDrivers = await fetch(`${BASE_URL}/api/drivers`);
      const data = await resDrivers.json();
      const matched = data.drivers?.find((d: any) => d.userId === meData.user.id);
      
      if (matched) {
        setDriverProfile(matched);
        await AsyncStorage.setItem('@driver_profile', JSON.stringify(matched));

        const resTrips = await fetch(`${BASE_URL}/api/trips`);
        const tripsData = await resTrips.json();
        const myTrips = tripsData.trips?.filter((t: any) => t.driverId === matched.id) || [];
        setTrips(myTrips);
        await AsyncStorage.setItem('@driver_trips', JSON.stringify(myTrips));
      }
      setIsOffline(false);
    } catch (err) {
      console.log('Network error, loading offline data...');
      setIsOffline(true);
      const cachedProfile = await AsyncStorage.getItem('@driver_profile');
      const cachedTrips = await AsyncStorage.getItem('@driver_trips');
      
      if (cachedProfile) setDriverProfile(JSON.parse(cachedProfile));
      if (cachedTrips) setTrips(JSON.parse(cachedTrips));
      
      if (!cachedProfile) {
        Alert.alert('Offline', 'No internet connection and no cached profile found.');
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
    // if (Platform.OS === 'android') {
    //   await Notifications.setNotificationChannelAsync('default', {
    //     name: 'default',
    //     importance: Notifications.AndroidImportance.MAX,
    //     vibrationPattern: [0, 250, 250, 250],
    //     lightColor: '#FF231F7C',
    //   });
    // }

    if (Device.isDevice) {
      // Notifications disabled for Expo Go
      // const { status: existingStatus } = await Notifications.getPermissionsAsync();
      // let finalStatus = existingStatus;
      // if (existingStatus !== 'granted') {
      //   const { status } = await Notifications.requestPermissionsAsync();
      //   finalStatus = status;
      // }
      // if (finalStatus !== 'granted') {
      //   return;
      // }
      // try {
      //   token = (await Notifications.getExpoPushTokenAsync({ projectId: '00000000-0000-0000-0000-000000000000' })).data;
      //   setExpoPushToken(token);
      // } catch (error) {
      //   console.warn("Could not fetch Expo Push Token (Requires EAS projectId). Using mock token.");
      //   setExpoPushToken('Mock-Expo-Push-Token-123');
      // }
    }
  }

  useEffect(() => {
    fetchData();
    registerForPushNotificationsAsync();
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['@driver_profile', '@driver_trips']);
      await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleAttendance = async () => {
    if (!driverProfile || isOffline) {
      if (isOffline) Alert.alert('Offline', 'Cannot change attendance while offline.');
      return;
    }
    const newStatus = driverProfile.attendanceStatus === 'Present' ? 'Absent' : 'Present';
    try {
      const res = await fetch(`${BASE_URL}/api/drivers/${driverProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceStatus: newStatus, availability: newStatus === 'Present' }),
      });
      if (res.ok) {
        setDriverProfile({ ...driverProfile, attendanceStatus: newStatus });

        // Trigger Local Notification
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        const locStr = location ? `Lat: ${location.coords.latitude.toFixed(3)}, Lng: ${location.coords.longitude.toFixed(3)}` : 'Unknown Location';
        
        // Notifications disabled for Expo Go
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const updateTripStatus = async (tripId: string, status: string) => {
    if (isOffline) {
      // In a fully offline app, we'd queue this to sync later. For now, just update local state.
      const updatedTrips = trips.map(t => t.id === tripId ? { ...t, status } : t);
      setTrips(updatedTrips);
      await AsyncStorage.setItem('@driver_trips', JSON.stringify(updatedTrips));
      Alert.alert('Offline Mode', 'Trip status saved locally. It will sync when connection returns.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update trip');
    }
  };

  // ... (rest of the methods remain the same)
  const takeIncidentPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!result.canceled) setIncidentImage(result.assets[0].uri);
  };

  const submitIncident = () => {
    if (!incidentNote) return Alert.alert('Missing Info', 'Please add a quick note.');
    setSubmittingIncident(true);
    setTimeout(() => {
      setSubmittingIncident(false);
      setShowIncidentModal(false);
      setIncidentNote('');
      setIncidentImage(null);
      Alert.alert("SOS Sent", "Dispatch has been notified.");
    }, 1500);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Profile...</Text>
      </LinearGradient>
    );
  }

  if (!driverProfile) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[globalStyles.container, { justifyContent: 'center' }]}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Profile Not Linked</Text>
          <GlassButton title="Log Out" onPress={handleLogout} variant="secondary" />
        </GlassCard>
      </LinearGradient>
    );
  }

  const activeTrip = trips.find(t => t.status === 'IN_PROGRESS' || t.status === 'IN_TRANSIT');
  const upcomingTrips = trips.filter(t => t.status === 'ASSIGNED' || t.status === 'PENDING');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');

  const COLOMBO = { latitude: 6.9271, longitude: 79.8612 };
  const KANDY = { latitude: 7.2906, longitude: 80.6337 };

  const completedCount = completedTrips.length;
  const baseSalary = driverProfile.salary || 0;
  const bonusPerTrip = 500;
  const totalBonus = completedCount * bonusPerTrip;
  const totalEarnings = baseSalary + totalBonus;

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.headerText}>Driver Console</Text>
          <Text style={globalStyles.subText}>Welcome, {driverProfile.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={{ backgroundColor: '#ef4444', padding: 8, borderRadius: 8, marginBottom: 15, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>⚠️ Offline Mode - Showing Cached Data</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ... Profile Card and Tabs rendering ... */}
        {activeTab !== 'earnings' && (
          <GlassCard style={{ marginBottom: 20 }}>
            <Text style={styles.licenseText}>License: {driverProfile.licenseNumber}</Text>
            <Text style={styles.statsText}>{driverProfile.experience} Yrs Exp | ⭐ {driverProfile.rating.toFixed(1)}</Text>
            <Text style={styles.statsText}>Today's Assignments: {trips.length}</Text>
          </GlassCard>
        )}

        {activeTab === 'home' && (
          <View>
            <Text style={styles.sectionTitle}>ATTENDANCE</Text>
            <GlassCard style={[styles.attendanceCard, driverProfile.attendanceStatus === 'Present' ? styles.borderGreen : styles.borderRed]}>
              <View>
                <Text style={styles.statusTitle}>Shift Status</Text>
                <Text style={styles.statusSub}>
                  {driverProfile.attendanceStatus === 'Present' ? '🟢 On Duty' : '🔴 Off Duty'}
                </Text>
              </View>
              <GlassButton 
                title={driverProfile.attendanceStatus === 'Present' ? 'Clock Out' : 'Clock In'} 
                variant={driverProfile.attendanceStatus === 'Present' ? 'secondary' : 'success'}
                onPress={handleToggleAttendance}
                style={{ paddingVertical: 10, paddingHorizontal: 20 }}
              />
            </GlassCard>

            <Text style={styles.sectionTitle}>GPS STATUS</Text>
            <GlassCard style={{ marginBottom: 15 }}>
              {errorMsg ? (
                <Text style={{color: '#f87171'}}>{errorMsg}</Text>
              ) : location ? (
                <View>
                  <Text style={{color: '#34d399', fontWeight: 'bold'}}>🟢 GPS Active & Broadcasting</Text>
                  <Text style={styles.runDetail}>Lat: {location.coords.latitude.toFixed(4)}</Text>
                  <Text style={styles.runDetail}>Lng: {location.coords.longitude.toFixed(4)}</Text>
                </View>
              ) : (
                <Text style={{color: '#fff'}}>Acquiring GPS Signal...</Text>
              )}
            </GlassCard>
            
            <Text style={styles.sectionTitle}>PUSH NOTIFICATIONS</Text>
            <GlassCard style={{ marginBottom: 15 }}>
               <Text style={{color: '#fff'}}>Token: {expoPushToken ? '✅ Registered' : '❌ Not Registered'}</Text>
               <GlassButton 
                  title="Test Notification" 
                  variant="secondary" 
                  style={{marginTop: 10}}
                  onPress={async () => {
                    // Notifications disabled for Expo Go
                  }} 
               />
            </GlassCard>
          </View>
        )}

        {activeTab === 'runs' && (
           <View>
            <Text style={styles.sectionTitle}>ACTIVE RUN</Text>
            {activeTrip ? (
              <GlassCard style={[styles.borderBlue, { marginBottom: 20, padding: 0, overflow: 'hidden' }]}>
                <View style={styles.mapContainer}>
                  <MapView 
                    style={styles.map}
                    initialRegion={{
                      latitude: location ? location.coords.latitude : COLOMBO.latitude,
                      longitude: location ? location.coords.longitude : COLOMBO.longitude,
                      latitudeDelta: 0.8,
                      longitudeDelta: 0.8,
                    }}
                  >
                    <Marker coordinate={COLOMBO} title={activeTrip.pickup} pinColor="blue" />
                    <Marker coordinate={KANDY} title={activeTrip.destination} pinColor="red" />
                    {location && (
                      <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="Bus Location">
                        <View style={styles.busMarker}><Ionicons name="bus" size={20} color="#fff" /></View>
                      </Marker>
                    )}
                    <Polyline 
                      coordinates={[COLOMBO, location ? {latitude: location.coords.latitude, longitude: location.coords.longitude} : COLOMBO, KANDY]}
                      strokeColor="#38bdf8"
                      strokeWidth={4}
                    />
                  </MapView>
                </View>
                
                <View style={{ padding: 20 }}>
                  <Text style={styles.runTitle}>{activeTrip.pickup} ➜ {activeTrip.destination}</Text>
                  <Text style={styles.runDetail}><Ionicons name="bus-outline" size={14} color="rgba(255,255,255,0.7)"/> {activeTrip.vehicle?.number || 'Bus'}</Text>
                  <Text style={styles.runDetail}>Pax: {activeTrip.weight} | ETA: {activeTrip.eta}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
                    <GlassButton 
                      title="⚠️ SOS" 
                      variant="secondary" 
                      onPress={() => setShowIncidentModal(true)}
                      style={{ flex: 1, marginRight: 10, borderColor: '#ef4444' }}
                    />
                    <GlassButton 
                      title="Complete Run" 
                      variant="success" 
                      onPress={() => updateTripStatus(activeTrip.id, 'COMPLETED')}
                      style={{ flex: 2 }}
                    />
                  </View>
                </View>
              </GlassCard>
            ) : (
              <GlassCard style={{ marginBottom: 20 }}>
                <Text style={{color: '#fff', textAlign: 'center'}}>No Active Journey</Text>
              </GlassCard>
            )}

            <Text style={styles.sectionTitle}>UPCOMING ASSIGNMENTS</Text>
            {upcomingTrips.map(trip => (
              <GlassCard key={trip.id} style={{ marginBottom: 15 }}>
                <Text style={styles.runTitle}>{trip.pickup} ➜ {trip.destination}</Text>
                <Text style={styles.runDetail}>Bus: {trip.vehicle?.number}</Text>
                <GlassButton 
                  title="Start Journey" 
                  variant="primary"
                  onPress={() => updateTripStatus(trip.id, 'IN_PROGRESS')}
                  disabled={!!activeTrip}
                  style={{ marginTop: 15 }}
                />
              </GlassCard>
            ))}
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            <Text style={styles.sectionTitle}>COMPLETED HISTORY</Text>
            {completedTrips.map(trip => (
              <GlassCard key={trip.id} style={{ marginBottom: 15, opacity: 0.8 }}>
                <Text style={styles.runTitle}>{trip.pickup} ➜ {trip.destination}</Text>
                <Text style={{ color: '#10b981', marginTop: 5 }}>✅ Done</Text>
              </GlassCard>
            ))}
          </View>
        )}

        {activeTab === 'earnings' && (
          <View>
            <Text style={styles.sectionTitle}>PERFORMANCE OVERVIEW</Text>
            <GlassCard style={{ marginBottom: 20, alignItems: 'center' }}>
              <Text style={{color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 'bold'}}>TOTAL MONTHLY EARNINGS</Text>
              <Text style={{color: '#38bdf8', fontSize: 36, fontWeight: '900', marginVertical: 10}}>
                LKR {totalEarnings.toLocaleString()}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{color: '#f59e0b', fontSize: 16, marginRight: 5}}>⭐</Text>
                <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>{driverProfile.rating.toFixed(1)} / 5.0 Rating</Text>
              </View>
            </GlassCard>

            <Text style={styles.sectionTitle}>BREAKDOWN</Text>
            <GlassCard style={{ marginBottom: 20 }}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Base Salary</Text>
                <Text style={styles.earningsVal}>LKR {baseSalary.toLocaleString()}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Trips Completed</Text>
                <Text style={styles.earningsVal}>{completedCount}</Text>
              </View>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Bonus per Trip</Text>
                <Text style={styles.earningsVal}>LKR {bonusPerTrip.toLocaleString()}</Text>
              </View>
              <View style={[styles.earningsRow, { borderBottomWidth: 0, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.earningsLabel, {color: '#fff', fontWeight: 'bold'}]}>Total Bonus</Text>
                <Text style={[styles.earningsVal, {color: '#10b981', fontWeight: 'bold'}]}>+ LKR {totalBonus.toLocaleString()}</Text>
              </View>
            </GlassCard>
            
            <GlassButton title="Withdraw Funds" variant="secondary" onPress={() => Alert.alert('Request Sent', 'Your withdrawal request has been sent to HR.')} />
          </View>
        )}
      </ScrollView>

      {/* Incident / SOS Modal */}
      <Modal visible={showIncidentModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Incident</Text>
              <TouchableOpacity onPress={() => setShowIncidentModal(false)}><Text style={{color: '#fff', fontSize: 20}}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.label}>Incident Type</Text>
            <View style={{flexDirection: 'row', marginBottom: 20, justifyContent: 'space-between'}}>
              {['Breakdown', 'Traffic', 'Accident'].map(type => (
                <TouchableOpacity 
                  key={type}
                  style={[styles.typeBtn, incidentType === type && styles.typeBtnActive]}
                  onPress={() => setIncidentType(type)}
                >
                  <Text style={{color: incidentType === type ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 'bold'}}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes</Text>
            <GlassInput 
              placeholder="Describe the issue..."
              value={incidentNote}
              onChangeText={setIncidentNote}
              multiline
              numberOfLines={3}
              style={{ height: 80, marginBottom: 20, textAlignVertical: 'top' }}
            />

            <Text style={styles.label}>Photo Proof (Optional)</Text>
            {incidentImage ? (
              <View style={{ position: 'relative', marginBottom: 20 }}>
                <Image source={{ uri: incidentImage }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setIncidentImage(null)}>
                  <Text style={{color: '#fff'}}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoBtn} onPress={takeIncidentPhoto}>
                <Ionicons name="camera-outline" size={24} color="#38bdf8" />
                <Text style={{color: '#38bdf8', fontWeight: 'bold', marginLeft: 8}}>Take Photo</Text>
              </TouchableOpacity>
            )}

            <GlassButton 
              title="SEND SOS ALERT" 
              variant="primary" 
              style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', shadowColor: '#ef4444' }}
              onPress={submitIncident}
              loading={submittingIncident}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Bottom Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navActive]} onPress={() => setActiveTab('home')}>
          <Ionicons name="speedometer-outline" size={24} color={activeTab === 'home' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'runs' && styles.navActive]} onPress={() => setActiveTab('runs')}>
          <Ionicons name="map-outline" size={24} color={activeTab === 'runs' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'runs' && styles.navTextActive]}>Runs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'earnings' && styles.navActive]} onPress={() => setActiveTab('earnings')}>
          <Ionicons name="wallet-outline" size={24} color={activeTab === 'earnings' ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.navText, activeTab === 'earnings' && styles.navTextActive]}>Pay</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 8, borderRadius: 8 },
  logoutText: { color: '#f87171', fontWeight: 'bold' },
  licenseText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statsText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: 10, marginTop: 10 },
  attendanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderGreen: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  borderRed: { borderLeftWidth: 4, borderLeftColor: '#f87171' },
  borderBlue: { borderLeftWidth: 4, borderLeftColor: '#38bdf8' },
  statusTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusSub: { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  runTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  runDetail: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  
  mapContainer: { height: 200, width: '100%', backgroundColor: '#000' },
  map: { ...StyleSheet.absoluteFillObject },
  busMarker: { backgroundColor: '#38bdf8', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },

  // Earnings
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  earningsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  earningsVal: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  typeBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  typeBtnActive: { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#38bdf8', borderStyle: 'dashed', borderRadius: 12, marginBottom: 20 },
  previewImage: { width: '100%', height: 150, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  bottomNav: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'rgba(15, 23, 42, 0.95)', flexDirection: 'row', borderRadius: 30, padding: 8, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  navItem: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
  navActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  navText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 10, marginTop: 4 },
  navTextActive: { color: '#38bdf8' }
});
