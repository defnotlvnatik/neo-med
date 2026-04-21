import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

export default function Navbar() {
  const { account, role, connectWalletRaw, disconnect, switchRole } = useWalletContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // UI visual reset block
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 z-50 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate(role ? `/${role}` : '/login')}>
         <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow">N</div>
         <h1 className="text-xl font-bold text-slate-800">Neo-<span className="text-blue-600">Med</span></h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        {!account ? (
           <button onClick={connectWalletRaw} className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50 font-bold px-5 py-2 rounded-full transition text-sm">
             Connect Wallet
           </button>
        ) : (
           <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 hover:bg-slate-50 border border-slate-200 p-1.5 pr-3 rounded-full transition shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                 <span className={`w-2.5 h-2.5 rounded-full ${role ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                 <span className="text-sm font-mono font-medium text-slate-700">{formatAddress(account)}</span>
              </div>
              {role && (
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                   role === 'admin' ? 'bg-purple-100 text-purple-700' :
                   role === 'doctor' ? 'bg-emerald-100 text-emerald-700' :
                   'bg-blue-100 text-blue-700'
                }`}>
                  {role}
                </span>
              )}
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
           </button>
        )}

        {/* Floating Context Web3 Modal */}
        {dropdownOpen && account && (
          <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 shadow-xl rounded-xl py-2 px-1 text-sm text-slate-700 z-[100] transform transition-all origin-top-right">
             <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 rounded cursor-pointer transition mb-1" onClick={handleCopy}>
                <div>
                   <p className="text-xs text-slate-400 mb-0.5 font-medium uppercase tracking-wide">Connected Wallet</p>
                   <p className="font-mono text-slate-800 font-medium tracking-wide">{formatAddress(account)}</p>
                </div>
                {copied ? (
                   <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200 shadow-sm">Copied!</span>
                ) : (
                   <div className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                   </div>
                )}
             </div>
             
             <hr className="my-1.5 border-slate-100 mx-2" />
             
             {role ? (
                <>
                  <div className="px-3 py-2 mb-1">
                     <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Active Identity Module</p>
                     <p className={`font-bold capitalize inline-block px-2 py-0.5 rounded text-xs border ${role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : role === 'doctor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{role}</p>
                  </div>
                  <button onClick={() => { setDropdownOpen(false); navigate(`/${role}`); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 transition rounded-md text-blue-600 font-bold flex items-center gap-2">
                     Go to Dashboard <span className="text-lg leading-none">&#8594;</span>
                  </button>
                  <button onClick={() => { setDropdownOpen(false); switchRole(); navigate('/login'); }} className="w-full text-left px-4 py-2 hover:bg-amber-50 transition rounded-md text-amber-700 font-bold flex items-center gap-2 mb-1">
                     Switch Role Focus <span className="text-lg leading-none">&#8644;</span>
                  </button>
                </>
             ) : (
                <div className="px-3 py-3 mb-1 bg-slate-50 rounded border border-slate-100 mx-2 text-center">
                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Identity Unverified</p>
                   <p className="font-medium text-slate-500 italic mt-0.5 text-xs">Select Role to verify map</p>
                </div>
             )}
             
             <hr className="my-1.5 border-slate-100 mx-2" />
             
             <button onClick={() => { setDropdownOpen(false); disconnect(); navigate('/login'); }} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 transition rounded-md font-bold mt-1 flex items-center gap-2">
                Disconnect Wallet
             </button>
          </div>
        )}
      </div>
    </header>
  );
}
