import { useState } from 'react';

export default function AccessManager({ contract, addTimelineEvent }) {
  const [doctorAddr, setDoctorAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [activeDoctors, setActiveDoctors] = useState([]);

  const handleGrant = async () => {
    if(!doctorAddr) return;
    try {
      setLoading(true);
      setTxHash('');
      const tx = await contract.grantAccess(doctorAddr);
      setTxHash(tx.hash);
      await tx.wait();
      
      const newActive = [...new Set([...activeDoctors, doctorAddr])];
      setActiveDoctors(newActive);
      addTimelineEvent(`Granted access to Doctor ${doctorAddr.slice(0,6)}...`, 'grant');
      setDoctorAddr('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error granting access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if(!doctorAddr) return;
    try {
      setLoading(true);
      setTxHash('');
      const tx = await contract.revokeAccess(doctorAddr);
      setTxHash(tx.hash);
      await tx.wait();
      
      setActiveDoctors(activeDoctors.filter(d => d !== doctorAddr));
      addTimelineEvent(`Revoked access from Doctor ${doctorAddr.slice(0,6)}...`, 'revoke');
      setDoctorAddr('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error revoking access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Access Control</h3>
      
      {txHash && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs mb-4 font-mono break-words">
          Tx: {txHash}
        </div>
      )}

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Wallet Address</label>
          <input 
            type="text" 
            placeholder="0x..." 
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
            value={doctorAddr}
            onChange={(e) => setDoctorAddr(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleGrant}
            disabled={loading || !doctorAddr}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '...' : 'Grant Access'}
          </button>
          <button 
            onClick={handleRevoke}
            disabled={loading || !doctorAddr}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '...' : 'Revoke Access'}
          </button>
        </div>
      </div>

      <div className="flex-1 border-t pt-4">
        <h4 className="text-sm font-bold text-slate-500 tracking-wider mb-3">Authorized Doctors</h4>
        {activeDoctors.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No external doctors currently tracked in session.</p>
        ) : (
          <ul className="space-y-2">
            {activeDoctors.map((doc, i) => (
              <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-mono text-xs text-slate-600">{doc.slice(0,8)}...{doc.slice(-6)}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">ACTIVE</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
