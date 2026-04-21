import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function MyPatients({ navigateToPatient }) {
  const { account, contract } = useWalletContext();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealPatients = async () => {
       if (!contract || !account) return;
       try {
          setLoading(true);

          // Find every AccessGranted event directed at this provider natively
          const filterGranted = contract.filters.AccessGranted(null, account);
          const grantedEvents = await contract.queryFilter(filterGranted);
          
          const uniquePatients = [...new Set(grantedEvents.map(ev => ev.args[0]))];
          
          const validPatients = [];
          for(const pAddr of uniquePatients) {
             const isActive = await contract.doctorAccess(pAddr, account);
             if (isActive) {
                 validPatients.push(pAddr);
             }
          }

          const patientContextList = [];
          
          for(const pAddr of validPatients) {
             // Retrieve the specific block timestamp this access was granted via the logs
             const specificGrantLog = grantedEvents.slice().reverse().find(ev => ev.args[0] === pAddr);
             let grantedDate = "Unknown Date";
             if (specificGrantLog) {
                 try {
                     const blockInfo = await specificGrantLog.getBlock();
                     grantedDate = new Date(blockInfo.timestamp * 1000).toLocaleDateString();
                 } catch(e) {}
             }

             // Count specific records payload
             const records = await contract.getPatientRecords(pAddr);
             
             patientContextList.push({
                 addr: pAddr,
                 name: `ID: ${pAddr.slice(0,6)}...${pAddr.slice(-4)}`,
                 records: records.length,
                 granted: grantedDate,
                 color: 'emerald'
             });
          }

          setPatients(patientContextList);

       } catch (err) {
          console.error("Failed fetching validated patients list:", err);
       } finally {
          setLoading(false);
       }
    };

    fetchRealPatients();
  }, [contract, account]);

  const filteredPatients = patients.filter(p => p.addr.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-4">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            My Patients
         </h2>
         <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet hash..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-slate-50 font-medium text-sm" 
            />
         </div>
       </div>

       {loading ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center">
                 <svg className="animate-spin h-8 w-8 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Blockchain Nodes...</p>
             </div>
       ) : patients.length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 text-slate-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                 <p className="text-lg font-bold text-slate-600">No Patient Constraints Identified</p>
                 <p className="text-sm text-slate-500 font-medium mt-1">Patients must explicitly share record constraints to your unique address before you can interface.</p>
             </div>
       ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {filteredPatients.map((p, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full bg-${p.color}-100 text-${p.color}-600 flex items-center justify-center text-sm font-bold shadow-inner`}>
                            0x
                         </div>
                         <div>
                            <p className="font-mono font-bold text-slate-800 text-lg">{p.addr.slice(0, 8)}...{p.addr.slice(-6)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-1">
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Access Granted
                         </span>
                         <p className="text-xs font-medium text-slate-400">Since {p.granted} • {p.records} Block Records</p>
                      </div>
                      <button onClick={() => navigateToPatient(p.addr)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition h-fit">
                         View Records
                      </button>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  )
}
