// Capa de cifrado compartida para Room (Expo / React Native)
// Usa react-native-quick-crypto para proporcionar crypto.subtle (Web Crypto API).
// Cifrado: AES-GCM con clave derivada de la contraseña del usuario (PBKDF2).
// Compatible con el formato de src/crypto.js (web / Electron).

import * as Crypto from 'react-native-quick-crypto';

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

async function deriveKey(password, salt) {
  const keyMaterial = await Crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return Crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function generateSalt() {
  return Crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

function generateIV() {
  return Crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

async function encrypt(plaintext, password) {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const ciphertext = await Crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    ENCODER.encode(plaintext)
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function decrypt(ciphertextB64, password) {
  let b64 = ciphertextB64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';

  const combined = new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const decrypted = await Crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return DECODER.decode(decrypted);
}

function isAvailable() {
  return typeof Crypto.subtle !== 'undefined';
}

export { encrypt, decrypt, deriveKey, generateSalt, generateIV, isAvailable };
