import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ViewProps, TextInputProps, TouchableOpacityProps, ActivityIndicator } from 'react-native';

export const GlassCard = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.glassCard, style]} {...props}>
    {children}
  </View>
);

export const GlassInput = ({ style, ...props }: TextInputProps) => (
  <TextInput 
    style={[styles.glassInput, style]} 
    placeholderTextColor="rgba(255,255,255,0.5)"
    {...props} 
  />
);

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'success';
  loading?: boolean;
}

export const GlassButton = ({ title, variant = 'primary', loading = false, style, ...props }: GlassButtonProps) => {
  const buttonStyle = [
    styles.btnBase,
    variant === 'primary' && styles.btnPrimary,
    variant === 'secondary' && styles.btnSecondary,
    variant === 'success' && styles.btnSuccess,
    props.disabled && { opacity: 0.5 },
    style
  ];

  return (
    <TouchableOpacity style={buttonStyle} {...props}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  gradientText: {
    color: '#38bdf8', // Simple fallback for gradient text
  }
});

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  glassInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    color: 'white',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    fontSize: 14,
  },
  btnBase: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9', // Base color of gradient
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  btnSecondary: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
  },
  btnSuccess: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
});
