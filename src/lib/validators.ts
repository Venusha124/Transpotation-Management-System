// Shared validation utilities for BTMS

export interface ValidationResult {
  valid: boolean;
  message: string;
}

// ----- Field validators -----

export const isRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName} is required.` };
  }
  return { valid: true, message: '' };
};

export const isValidEmail = (email: string): ValidationResult => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return { valid: false, message: 'Email address is required.' };
  if (!regex.test(email.trim())) return { valid: false, message: 'Please enter a valid email address (e.g. user@domain.com).' };
  return { valid: true, message: '' };
};

export const isValidPassword = (password: string): ValidationResult => {
  if (!password) return { valid: false, message: 'Password is required.' };
  if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters.' };
  return { valid: true, message: '' };
};

export const isPositiveInteger = (value: string, fieldName: string): ValidationResult => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return { valid: false, message: `${fieldName} must be a valid number.` };
  if (num <= 0) return { valid: false, message: `${fieldName} must be greater than zero.` };
  return { valid: true, message: '' };
};

export const isPositiveNumber = (value: string, fieldName: string): ValidationResult => {
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, message: `${fieldName} must be a valid number.` };
  if (num <= 0) return { valid: false, message: `${fieldName} must be greater than zero.` };
  return { valid: true, message: '' };
};

export const isWithinRange = (value: string, min: number, max: number, fieldName: string): ValidationResult => {
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, message: `${fieldName} must be a valid number.` };
  if (num < min || num > max) return { valid: false, message: `${fieldName} must be between ${min} and ${max}.` };
  return { valid: true, message: '' };
};

export const isFutureDate = (dateStr: string, fieldName: string): ValidationResult => {
  if (!dateStr) return { valid: false, message: `${fieldName} is required.` };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { valid: false, message: `${fieldName} is not a valid date.` };
  return { valid: true, message: '' };
};

export const isValidSriLankaPlate = (plate: string): ValidationResult => {
  if (!plate.trim()) return { valid: false, message: 'Bus number / plate is required.' };
  const regex = /^[A-Z]{2}-\d{4}$/;
  if (!regex.test(plate.trim().toUpperCase())) {
    return { valid: false, message: 'Bus plate must follow format: XX-0000 (e.g. NB-8844).' };
  }
  return { valid: true, message: '' };
};

export const isValidContact = (contact: string): ValidationResult => {
  if (!contact.trim()) return { valid: false, message: 'Contact number is required.' };
  const regex = /^\+94\d{9}$/;
  if (!regex.test(contact.trim())) {
    return { valid: false, message: 'Contact must be in format: +94XXXXXXXXX (Sri Lanka).' };
  }
  return { valid: true, message: '' };
};

export const isValidNIC = (nic: string): ValidationResult => {
  if (!nic.trim()) return { valid: false, message: 'NIC number is required.' };
  const oldNIC = /^\d{9}[VvXx]$/;
  const newNIC = /^\d{12}$/;
  if (!oldNIC.test(nic.trim()) && !newNIC.test(nic.trim())) {
    return { valid: false, message: 'NIC must be 9 digits + V/X (old) or 12 digits (new format).' };
  }
  return { valid: true, message: '' };
};

export const isValidLatitude = (lat: string): ValidationResult => {
  return isWithinRange(lat, 5.7, 9.9, 'Latitude (Sri Lanka)');
};

export const isValidLongitude = (lng: string): ValidationResult => {
  return isWithinRange(lng, 79.4, 82.0, 'Longitude (Sri Lanka)');
};

export const minLength = (value: string, min: number, fieldName: string): ValidationResult => {
  if (!value.trim()) return { valid: false, message: `${fieldName} is required.` };
  if (value.trim().length < min) return { valid: false, message: `${fieldName} must be at least ${min} characters.` };
  return { valid: true, message: '' };
};

// ----- Collect all errors into one string -----
export const collectErrors = (results: ValidationResult[]): string => {
  const errors = results.filter(r => !r.valid).map(r => r.message);
  return errors.length > 0 ? errors[0] : ''; // Return first error
};
