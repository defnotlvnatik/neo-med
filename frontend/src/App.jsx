import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Patient from './pages/Patient';
import Doctor from './pages/Doctor';
import Admin from './pages/Admin';
import { WalletProvider, useWalletContext } from './context/WalletContext';
import Navbar from './components/Navbar';

function AppContent() {
  const { account, role, contract } = useWalletContext();

  return (
    <BrowserRouter>
      {/* 4. Abstracting away header context internally directly replacing it globally */}
      <div className="min-h-screen relative flex flex-col pt-16 bg-slate-50">
        <Navbar />

        <main className="flex-1 overflow-y-auto w-full md:p-6 pb-20">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/patient" 
              element={(account && role === 'patient') ? <Patient contract={contract} account={account} /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/doctor" 
              element={(account && role === 'doctor') ? <Doctor contract={contract} account={account} /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/admin" 
              element={(account && role === 'admin') ? <Admin contract={contract} account={account} /> : <Navigate to="/login" />} 
            />
            
            {/* Catch-all safely directs unrecognized bounds mapping down */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    // Binding the entire application securely into the Global Wallet Context Block 
    <WalletProvider>
       <AppContent />
    </WalletProvider>
  );
}
