import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState('');
  const [role, setRole] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize from localStorage silently
  useEffect(() => {
    const init = async () => {
       const savedAccount = localStorage.getItem('ehr_account');
       const savedRole = localStorage.getItem('ehr_role');
       if (savedAccount && window.ethereum) {
           try {
             const provider = new ethers.BrowserProvider(window.ethereum);
             const accounts = await provider.send("eth_accounts", []);
             if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
                const signer = await provider.getSigner();
                const ehrContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                setAccount(accounts[0]);
                setContract(ehrContract);
                if (savedRole) setRole(savedRole);
             } else {
                 disconnect();
             }
           } catch(e) {
               console.error(e);
           }
       }
    };
    init();
  }, []);

  // Standard raw connect (Navbar State 1) strictly fetches address via ethers popup map
  const connectWalletRaw = async () => {
      if(!window.ethereum) return alert("Install MetaMask");
      try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          const ehrContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setAccount(accounts[0]);
          setContract(ehrContract);
          localStorage.setItem('ehr_account', accounts[0]);
      } catch (e) {
          console.error(e);
      }
  };

  // Connect and verify explicitly bypassing popup if address is pre-cached
  const connectAndVerifyRole = async (targetRole) => {
      if(!window.ethereum) return { error: "Install MetaMask" };
      try {
          setLoading(true);
          const provider = new ethers.BrowserProvider(window.ethereum);
          let address = account; 

          // Invoke MetaMask ONLY if the provider hasn't attached yet
          if (!address) {
             const accounts = await provider.send("eth_requestAccounts", []);
             address = accounts[0];
          }

          const signer = await provider.getSigner();
          const ehrContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

          let hasAccess = false;
          if (targetRole === 'admin') {
             hasAccess = await ehrContract.hasRole(ethers.ZeroHash, address);
          } else if (targetRole === 'doctor') {
             hasAccess = await ehrContract.hasRole(ethers.id("DOCTOR_ROLE"), address);
          } else if (targetRole === 'patient') {
             hasAccess = await ehrContract.hasRole(ethers.id("PATIENT_ROLE"), address);
          }

          // Elevation match
          if (hasAccess) {
              setAccount(address);
              setRole(targetRole);
              setContract(ehrContract);
              localStorage.setItem('ehr_account', address);
              localStorage.setItem('ehr_role', targetRole);
              return { success: true };
          } else {
              return { error: `Access Denied: Wallet ${address.slice(0,6)}... is not registered as a ${targetRole.toUpperCase()}` };
          }
      } catch(e) {
          console.error(e);
          return { error: "Wallet request rejected or failed." };
      } finally {
          setLoading(false);
      }
  };

  // Total disconnect dropping localStorage boundaries and React values
  const disconnect = () => {
      setAccount('');
      setRole(null);
      setContract(null);
      localStorage.removeItem('ehr_account');
      localStorage.removeItem('ehr_role');
  };

  // Scoped wipe dropping strictly role matrix limits
  const switchRole = () => {
      setRole(null);
      localStorage.removeItem('ehr_role');
  };

  return (
    <WalletContext.Provider value={{ account, role, contract, loading, connectWalletRaw, connectAndVerifyRole, disconnect, switchRole }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWalletContext = () => useContext(WalletContext);
