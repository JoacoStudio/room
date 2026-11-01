// Capa de cifrado compartida para Room (web / Electron)
// Usa Web Crypto API (crypto.subtle) disponible en navegadores modernos y Electron.
// Cifrado: AES-GCM con clave derivada de la contraseña del usuario (PBKDF2).

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits, recomendado para GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Deriva una clave criptográfica a partir de una contraseña usando PBKDF2.
 * @param {string} password - Contraseña del usuario
 * @param {Uint8Array} salt - Sal aleatoria
 * @returns {Promise<CryptoKey>} Clave criptográfica derivada
 */
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
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

/**
 * Genera una sal aleatoria.
 * @returns {Uint8Array} Sal de SALT_LENGTH bytes
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Genera un vector de inicialización (IV) aleatorio.
 * @returns {Uint8Array} IV de IV_LENGTH bytes
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Cifra un texto plano con una clave derivada de la contraseña.
 * @param {string} plaintext - Texto a cifrar
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<string>} String en formato base64url que contiene: salt + iv + ciphertext
 */
async function encrypt(plaintext, password) {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    ENCODER.encode(plaintext)
  );

  // Concatenar: salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Descifra un texto cifrado previamente cifrado con encrypt().
 * @param {string} ciphertextB64 - String en formato base64url (salt + iv + ciphertext)
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<string>} Texto plano descifrado
 * @throws {Error} Si la contraseña es incorrecta o los datos están corruptos
 */
async function decrypt(ciphertextB64, password) {
  // Restaurar padding de base64url
  let b64 = ciphertextB64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';

  const combined = new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return DECODER.decode(decrypted);
}

/**
 * Verifica si Web Crypto API está disponible en el entorno actual.
 * @returns {boolean}
 */
function isAvailable() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

export { encrypt, decrypt, deriveKey, generateSalt, generateIV, isAvailable };
