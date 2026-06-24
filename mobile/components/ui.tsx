import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  );
}

interface GlassInputProps extends React.ComponentProps<typeof TextInput> {}

export function GlassInput(props: GlassInputProps) {
  return (
    <TextInput 
      placeholderTextColor="rgba(255,255,255,0.4)"
      {...props}
      style={[styles.glassInput, props.style]}
    />
  );
}

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
}

export function GlassButton({ title, onPress, variant = 'primary', style, textStyle, loading, disabled }: GlassButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.btnPrimary;
      case 'secondary': return styles.btnSecondary;
      case 'success': return styles.btnSuccess;
      default: return styles.btnPrimary;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.glassButton, getVariantStyle(), disabled && styles.btnDisabled, style]} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.glassButtonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Slightly transparent slate
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  glassInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    fontSize: 16,
  },
  glassButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  btnPrimary: {
    backgroundColor: 'rgba(2, 132, 199, 0.8)',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
  },
  btnSecondary: {
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
  },
  btnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderColor: '#34d399',
    shadowColor: '#10b981',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  glassButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  }
});

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate 900
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  }
});
