import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  exp?: number;
  iat?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-tms-jwt-key';

// Password Hashing (Node.js runtime)
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Token Signing (Node.js runtime)
export function signToken(payload: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Standard verification for Node.js API Routes
export function verifyTokenNode(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Edge-runtime compatible Base64URL decoder
function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Edge-runtime compatible JWT Signature Verifier using native Web Crypto API
export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64urlDecode(signatureB64);

    // Verify HMAC signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      data
    );

    if (!isValid) return null;

    // Decode and parse payload
    const payloadStr = new TextDecoder().decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Edge JWT Verification Error:', error);
    return null;
  }
}
