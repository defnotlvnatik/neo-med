import { useState } from 'react';

export default function EmergencyButton({ contract, addTimelineEvent }) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const triggerEmergency = async () => {
    const confirm = window.confirm("WARNING: This will instantly grant full read access to global Emergency Responders. Continue?");
    if (!confirm) return;

    try {
      setLoading(true);
      // Hardcoded responder network address (simulate if no specific contract function exists)
      const emergencyResponderAddress = "0x0000000000000000000000000000000000001011";
      const tx = await contract.grantAccess(emergencyResponderAddress);
      
      setTxHash(tx.hash);
      await tx.wait();
      
      addTimelineEvent("Emergency Access Override Triggered", "grant");
      alert("Emergency protocols activated successfully.");
    } catch (err) {
      console.error(err);
      alert("Action failed. Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Critical Override
        </h3>
        <p className="text-sm text-red-600 mt-1">Broadcast records to registered Emergency Response organizations instantly.</p>
        {txHash && <p className="text-xs font-mono text-red-800 mt-2 break-all">Tx: {txHash}</p>}
      </div>
      <button 
        onClick={triggerEmergency}
        disabled={loading}
        className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-md disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Activating...' : 'Emergency Access'}
      </button>
    </div>
  );
}
