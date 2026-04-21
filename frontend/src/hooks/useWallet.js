import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

export function useWallet() {
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const connectAndVerify = async (selectedRole, existingAccount = null) => {
    setError('');
    
    if (!window.ethereum) {
      setError("Please install MetaMask to proceed.");
      return null;
    }

    try {
      setLoadingRole(selectedRole);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      let address;
      
      // Bypass eth_requestAccounts popup if the wallet address is already stored in memory
      if (existingAccount) {
         address = existingAccount;
      } else {
         const accounts = await provider.send("eth_requestAccounts", []);
         address = accounts[0];
      }
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      let hasAccess = false;
      
      if (selectedRole === 'admin') {
         hasAccess = await contract.hasRole(ethers.ZeroHash, address);
      } else if (selectedRole === 'doctor') {
         hasAccess = await contract.hasRole(ethers.id("DOCTOR_ROLE"), address);
      } else if (selectedRole === 'patient') {
         hasAccess = await contract.hasRole(ethers.id("PATIENT_ROLE"), address);
      }

      if (hasAccess) {
        return { address, contract, selectedRole }; 
      } else {
        setError(`Access Denied: Wallet ${address.slice(0,6)}... is not registered as a ${selectedRole.toUpperCase()}!`);
        return null; 
      }
    } catch (err) {
      console.error(err);
      setError("Wallet connection failed or request rejected.");
      return null;
    } finally {
      setLoadingRole(null);
    }
  };

  return { connectAndVerify, loadingRole, error };
}
