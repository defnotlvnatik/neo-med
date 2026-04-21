import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function AccessControl() {
  const { account, contract } = useWalletContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [targetDoctor, setTargetDoctor] = useState('');
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState(null); // stores address of doctor being revoked
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDoctorAccess = async () => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      // Because EVM mappings can't be listed natively, we scan for AccessGranted events strictly
      const filter = contract.filters.AccessGranted(account, null);
      const events = await contract.queryFilter(filter);

      // We extract all unique addresses we ever granted access to
      const uniqueDoctors = [...new Set(events.map(ev => ev.args[1]))];

      const doctorList = [];
      
      // Check current mapping status dynamically
      for (const docAddr of uniqueDoctors) {
         const isActive = await contract.doctorAccess(account, docAddr);
         doctorList.push({
            address: docAddr,
            status: isActive ? 'Active' : 'Revoked',
            pulse: isActive ? 'bg-emerald-500' : 'bg-red-500'
         });
      }

      setDoctors(doctorList);
    } catch (err) {
      console.error("Failed fetching access scopes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAccess();
  }, [contract, account]);

  const handleGrant = async () => {
      setError('');
      setSuccess('');
      if (!targetDoctor || targetDoctor.length !== 42 || !targetDoctor.startsWith("0x")) {
         setError("Please specify a valid Ethereum wallet address.");
         return;
      }

      try {
         setGranting(true);
         const tx = await contract.grantAccess(targetDoctor);
         await tx.wait();
         setSuccess(`Successfully mapped access scope for ${targetDoctor.slice(0,6)}...`);
         setTargetDoctor('');
         fetchDoctorAccess(); // Poll UI refresh
      } catch (err) {
         console.error(err);
         setError(err.reason || "Blockchain transaction rejected.");
      } finally {
         setGranting(false);
      }
  };

  const handleRevoke = async (doctorAddress) => {
      setError('');
      setSuccess('');
      try {
         setRevoking(doctorAddress);
         const tx = await contract.revokeAccess(doctorAddress);
         await tx.wait();
         setSuccess(`Successfully severed access scope for ${doctorAddress.slice(0,6)}...`);
         fetchDoctorAccess(); // Poll UI refresh
      } catch (err) {
         console.error(err);
         setError(err.reason || "Blockchain transaction rejected.");
      } finally {
         setRevoking(null);
      }
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Provider Access Control Hub
       </h2>
       
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-end">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end w-full">
            <div className="flex-1 w-full relative">
              <label className="block text-sm font-bold text-slate-800 mb-2">Doctor Wallet Address Input</label>
              <input 
                 type="text" 
                 value={targetDoctor}
                 onChange={(e) => setTargetDoctor(e.target.value)}
                 placeholder="0x..." 
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-700 bg-slate-50" 
              />
            </div>
            
            <button 
               onClick={handleGrant}
               disabled={granting}
               className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl shadow-md transition whitespace-nowrap flex items-center justify-center gap-2 h-[50px] lg:mt-0 mt-4"
            >
              {granting ? (
                 <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
              ) : (
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              )}
              {granting ? 'Broadcasting...' : 'Grant Network Access'}
            </button>
          </div>
          
          <div className="w-full mt-4">
             {error && <div className="text-red-600 bg-red-50 p-2 rounded-lg text-sm font-bold border border-red-200 text-center">{error}</div>}
             {success && <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg text-sm font-bold border border-emerald-200 text-center">{success}</div>}
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[250px] relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                    </svg>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Verifying EVM Cryptographic Mappings...</p>
                 </div>
              </div>
          ) : doctors.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                 <p className="font-bold text-lg text-slate-600">No providers mapped.</p>
                 <p className="text-sm mt-1">Grant access to a doctor's wallet address to begin sharing records natively.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8FAFC] border-b border-slate-200">
                   <tr>
                     <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Healthcare Provider Module</th>
                     <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Node Access Status</th>
                     <th className="p-4 text-slate-500 font-bold tracking-wide text-right uppercase text-xs">Operations</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {doctors.map((doc, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                             </div>
                             <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{doc.address}</span>
                          </div>
                       </td>
                       <td className="p-4">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm border ${doc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                           {doc.status === 'Active' && <span className={`w-1.5 h-1.5 rounded-full ${doc.pulse} animate-pulse`}></span>}
                           {doc.status}
                         </span>
                       </td>
                       <td className="p-4 text-right">
                         <button 
                            onClick={() => handleRevoke(doc.address)}
                            disabled={doc.status !== 'Active' || revoking === doc.address}
                            className="text-red-600 hover:text-red-800 font-bold px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg shadow-sm transition disabled:opacity-40 flex items-center gap-2 ml-auto"
                         >
                           {revoking === doc.address && <svg className="animate-spin h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>}
                           Revoke Scope Matrix
                         </button>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          )}
       </div>
    </div>
  )
}
