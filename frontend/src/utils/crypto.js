// src/utils/crypto.js

/**
 * Helper to derive a 256-bit AES-GCM CryptoKey from a string (public/private key)
 */
async function getAESKey(keyString, usage) {
  const enc = new TextEncoder();
  // Normalize string to lowercase to ensure consistent key derivation (critical for ETH addresses)
  const normalizedKey = typeof keyString === 'string' ? keyString.toLowerCase() : keyString;
  const keyMaterial = await window.crypto.subtle.digest(
    'SHA-256', 
    enc.encode(normalizedKey)
  );
  return window.crypto.subtle.importKey(
    "raw", 
    keyMaterial, 
    { name: "AES-GCM" }, 
    false, 
    [usage]
  );
}

/**
 * Encrypts a File object using AES-256-GCM via Web Crypto API.
 * Uses the patientPublicKey (string) to derive the encryption key.
 */
export async function encryptFile(file, patientPublicKey) {
  const key = await getAESKey(patientPublicKey, "encrypt");
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const fileBuffer = await file.arrayBuffer();
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  // Prepend IV to the encrypted data
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

  return new File([combinedBuffer], `${file.name}.enc`, { 
    type: "application/octet-stream" 
  });
}

/**
 * Decrypts an encrypted File/Blob using AES-256-GCM via Web Crypto API.
 * Uses a retry mechanism for address casing backward compatibility.
 */
export async function decryptFile(encryptedData, privateKey) {
  const normalizedKey = privateKey.toLowerCase();
  
  const attemptDecryption = async (keyString) => {
    const key = await getAESKey(keyString, "decrypt");
    const encryptedArray = new Uint8Array(await encryptedData.arrayBuffer());
    
    // Safety check for empty or malformed files
    if (encryptedArray.length < 13) throw new Error("Invalid encrypted file format.");

    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);

    return await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
  };

  let decryptedBuffer;
  try {
    // Attempt 1: Lowercase key (New standard)
    decryptedBuffer = await attemptDecryption(normalizedKey);
  } catch (e) {
    try {
      // Attempt 2: Raw key (Backward compatibility for mixed-case uploads)
      console.warn("Standard decryption failed, attempting legacy raw key match...");
      decryptedBuffer = await attemptDecryption(privateKey);
    } catch (e2) {
      throw new Error("Decryption failed: Invalid key or corrupted data block.");
    }
  }

  // Basic MIME type detection based on byte signatures
  const header = new Uint8Array(decryptedBuffer).slice(0, 4);
  let mimeType = "application/octet-stream";
  
  const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  if (hex.startsWith("25504446")) mimeType = "application/pdf";
  else if (hex.startsWith("89504E47")) mimeType = "image/png";
  else if (hex.startsWith("FFD8FF")) mimeType = "image/jpeg";
  else if (hex.startsWith("47494638")) mimeType = "image/gif";

  return new Blob([decryptedBuffer], { type: mimeType });
}
