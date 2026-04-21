import { useState } from 'react';

export default function WalletHeader({ account }) {
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">Connected Network</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="font-bold text-slate-800">Ethereum Sepolia</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg font-mono text-sm text-slate-700">
          {shortenAddress(account)}
        </div>
        <button 
          onClick={copyToClipboard}
          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
          title="Copy Address"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
