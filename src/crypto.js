// Capa de cifrado compartida para Room (web / Electron)
// Usa crypto-js (vía CDN) para AES-CBC y Web Crypto API para bytes aleatorios y hash.
// Compatible con expo-app/src/crypto.js usando el mismo formato.
// Formato de salida: base64url(salt + iv + ciphertext) todo en hex concatenado.

(function () {
  const ENCODER = new TextEncoder();
  const DECODER = new TextDecoder();

  const SALT_LENGTH = 16;
  const IV_LENGTH = 16; // AES block size

  async function deriveKey(password, salt) {
    // Derivar clave: SHA-256(password + salt)
    const saltStr = DECODER.decode(salt);
    const hashInput = ENCODER.encode(password + saltStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashInput);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return CryptoJS.enc.Hex.parse(hashHex);
  }

  function generateSalt() {
    const arr = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(arr);
    return CryptoJS.lib.WordArray.create(arr);
  }

  function generateIV() {
    const arr = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(arr);
    return CryptoJS.lib.WordArray.create(arr);
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

    const bytes = [];
    for (let i = 0; i < combined.length; i += 2) {
      bytes.push(parseInt(combined.substr(i, 2), 16));
    }
    const binary = bytes.map((b) => String.fromCharCode(b)).join('');

    return b64urlEncode(binary);
  }

  async function decrypt(ciphertextB64, password) {
    const binary = b64urlDecode(ciphertextB64);

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
    return typeof CryptoJS !== 'undefined' && typeof crypto !== 'undefined';
  }

  window.RoomCrypto = {
    encrypt,
    decrypt,
    deriveKey,
    generateSalt,
    generateIV,
    isAvailable
  };
})();
