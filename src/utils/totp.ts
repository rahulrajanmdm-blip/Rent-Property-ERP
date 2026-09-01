// Standard RFC 6238 Time-based One-Time Password (TOTP) implementation
// Compatible with Google Authenticator, Microsoft Authenticator, Apple Passwords, Authy

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32ToUint8Array(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanBase32.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

export function generateBase32Secret(length: number = 16): string {
  let secret = '';
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % BASE32_CHARS.length];
  }
  return secret;
}

export async function generateTOTP(secretBase32: string, timeStepSeconds: number = 30, digits: number = 6): Promise<string> {
  const keyBytes = base32ToUint8Array(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds);

  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // High 32-bits
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  // Low 32-bits
  counterView.setUint32(4, counter & 0xffffffff, false);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

export async function verifyTOTP(
  inputOtp: string,
  secretBase32: string,
  windowTolerance: number = 1
): Promise<boolean> {
  const cleanInput = inputOtp.trim().replace(/\s/g, '');
  if (cleanInput.length !== 6) return false;

  const keyBytes = base32ToUint8Array(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStepSeconds = 30;
  const currentCounter = Math.floor(epoch / timeStepSeconds);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  // Check current counter and +/- windowTolerance steps for clock drift
  for (let delta = -windowTolerance; delta <= windowTolerance; delta++) {
    const counter = currentCounter + delta;
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
    counterView.setUint32(4, counter & 0xffffffff, false);

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hash = new Uint8Array(signature);

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    if (otp === cleanInput) {
      return true;
    }
  }

  return false;
}

export function getTOTPUri(email: string, secretBase32: string, issuer: string = 'Dream Dwell ERP'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
