import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function WritePrescription({ selectedPatient }) {
  const { account, contract } = useWalletContext();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchValidPatients = async () => {
         if (!contract || !account) return;
         try {
             setLoading(true);
             const filterGranted = contract.filters.AccessGranted(null, account);
             const grantedEvents = await contract.queryFilter(filterGranted);
             
             const uniquePatients = [...new Set(grantedEvents.map(ev => ev.args[0]))];
             const validPatients = [];
             for(const pAddr of uniquePatients) {
                if (await contract.doctorAccess(pAddr, account)) {
                    validPatients.push(pAddr);
                }
             }
             setPatients(validPatients);
         } catch(e) {
             console.error(e);
         } finally {
             setLoading(false);
         }
     }
     fetchValidPatients();
  }, [contract, account]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Write Clinical Prescription
       </h2>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form className="space-y-6">
             <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Target Patient Identity Block</label>
               {loading ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 animate-pulse font-bold text-sm">Syncing authorized IDs...</div>
               ) : (
                  <select defaultValue={selectedPatient || ""} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-bold bg-slate-50 cursor-pointer">
                    <option value="">Select identity hash...</option>
                    {patients.map((p, i) => (
                       <option key={i} value={p}>ID: {p.slice(0,10)}...{p.slice(-8)}</option>
                    ))}
                  </select>
               )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Medication Matrix Core</label>
                   <input type="text" placeholder="e.g. Amoxicillin" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Dosage Parameter</label>
                   <input type="text" placeholder="e.g. 500mg" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50" />
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Frequency Distribution</label>
                   <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50 text-slate-700">
                     <option>Once daily</option>
                     <option>Twice daily</option>
                     <option>Three times daily</option>
                     <option>As needed block</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-800 mb-2">Duration Parameter Limits</label>
                   <input type="text" placeholder="e.g. 7 days" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50" />
                 </div>
             </div>

             <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Clinical Context Notes / ICD-10 Hash</label>
               <textarea rows="4" placeholder="Enter clinical rationale..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-slate-50 font-medium"></textarea>
             </div>

             <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
               <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center gap-2">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                 Sign & Submit Cryptographically to Blockchain
               </button>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-4 text-center">Identity: {account ? account : 'Wallet Not Connected'}</p>
             </div>
          </form>
       </div>
    </div>
  )
}
