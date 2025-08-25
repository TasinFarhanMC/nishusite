// src/libs/crypto.ts

// Convert string to Uint8Array
export function strToBuf(str: string) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer/Uint8Array to string
export function bufToStr(buf: ArrayBuffer | Uint8Array): string {
  return new TextDecoder().decode(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
}

// Convert ArrayBuffer to Base64 (browser + Node-safe)
export function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Encrypt a string with password
export async function encrypt(message: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuf(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    strToBuf(message).buffer
  );

  // Pack salt + iv + ciphertext
  const packed = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.byteLength);
  packed.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

  return bufToBase64(packed.buffer);
}

export class PasswordError extends Error {
  constructor(message = "Wrong Password") {
    super(message);
    this.name = "PasswordError";
  }
}

// Decrypt string with password
export async function decrypt(token: string, password: string): Promise<string> {
  const data = base64ToBuf(token);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuf(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext.buffer
    );
    return bufToStr(plainBuf);
  } catch {
    throw new PasswordError;
  }
}
