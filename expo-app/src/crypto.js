// Capa de cifrado compartida para Room (Expo / React Native)
// Usa crypto-js (JavaScript puro) para AES-CBC y expo-crypto para bytes aleatorios.
// Compatible con src/crypto.js (web / Electron) usando el mismo formato.
// Formato de salida: base64url(salt + iv + ciphertext) todo en hex concatenado.

import * as ExpoCrypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const SALT_LENGTH = 16;
const IV_LENGTH = 16; // AES block size

async function deriveKey(password, salt) {
  // Derivar clave: SHA-256(password + salt)
  const saltStr = DECODER.decode(salt);
  const hashInput = ENCODER.encode(password + saltStr);
  const hashHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    hashInput,
    { returnAsHex: true }
  );
  return CryptoJS.enc.Hex.parse(hashHex);
}

function generateSalt() {
  return CryptoJS.lib.WordArray.random(SALT_LENGTH);
}

function generateIV() {
  return CryptoJS.lib.WordArray.random(IV_LENGTH);
}

function toHex(wordArray) {
  return wordArray.toString(CryptoJS.enc.Hex);
}

function fromHex(hex) {
  return CryptoJS.enc.Hex.parse(hex);
}

function b64urlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return atob(b64);
}

async function encrypt(plaintext, password) {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const saltHex = toHex(salt);
  const ivHex = toHex(iv);
  const ctHex = toHex(encrypted.ciphertext);

  const combined = saltHex + ivHex + ctHex;

  // Convertir hex string a bytes para base64
  const bytes = [];
  for (let i = 0; i < combined.length; i += 2) {
    bytes.push(parseInt(combined.substr(i, 2), 16));
  }
  const binary = bytes.map((b) => String.fromCharCode(b)).join('');

  return b64urlEncode(binary);
}

async function decrypt(ciphertextB64, password) {
  const binary = b64urlDecode(ciphertextB64);

  // Convertir binary a hex
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
  }

  const saltHex = hex.slice(0, SALT_LENGTH * 2);
  const ivHex = hex.slice(SALT_LENGTH * 2, (SALT_LENGTH + IV_LENGTH) * 2);
  const ctHex = hex.slice((SALT_LENGTH + IV_LENGTH) * 2);

  const salt = fromHex(saltHex);
  const iv = fromHex(ivHex);
  const key = await deriveKey(password, salt);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: fromHex(ctHex) },
    key,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}

function isAvailable() {
  return true;
}

export { encrypt, decrypt, deriveKey, generateSalt, generateIV, isAvailable };
