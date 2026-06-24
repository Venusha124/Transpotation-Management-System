import React, { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, GlassInput, GlassButton, globalStyles } from '../components/ui';
import { BASE_URL } from '../config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      console.log(`Connecting to ${BASE_URL}/api/auth/login...`);
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Success! Route based on role
      if (data.user.role === 'DRIVER') {
        router.replace('/driver');
      } else if (data.user.role === 'CONDUCTOR') {
        router.replace('/conductor');
      } else {
        Alert.alert('Access Denied', 'This mobile app is only for Drivers and Conductors.');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* We will just use a placeholder text for logo to match the vibe */}
          <Text style={styles.logoTitle}>ASCENDIA</Text>
          <Text style={styles.logoSubtitle}>TRANSPORTS</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={globalStyles.subText}>Enter your credentials to access</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <GlassInput 
              placeholder="e.g. driver@tms.com" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <GlassInput 
              placeholder="••••••••" 
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <GlassButton 
            title="Sign In" 
            onPress={handleLogin} 
            loading={loading} 
            style={{ marginTop: 10 }}
          />
        </GlassCard>
        
        <Text style={styles.footer}>&copy; {new Date().getFullYear()} ASCENDIA SOLUTIONS</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 2,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
  },
  card: {
    paddingVertical: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formGroup: {
    marginTop: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 40,
  }
});
