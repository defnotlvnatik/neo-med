// src/utils/ipfs.js

/**
 * Uploads a file object to Pinata IPFS using standard fetch.
 * Returns the IPFS CID hash.
 */
export async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretKey = import.meta.env.VITE_PINATA_SECRET;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata API credentials missing. Please set VITE_PINATA_API_KEY and VITE_PINATA_SECRET in .env");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      "pinata_api_key": apiKey,
      "pinata_secret_api_key": secretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`IPFS Upload failed: ${errorMsg}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}
