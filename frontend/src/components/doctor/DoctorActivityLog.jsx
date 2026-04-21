import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function DoctorActivityLog() {
  const { account, contract } = useWalletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealLogs = async () => {
      if (!contract || !account) return;
      try {
         setLoading(true);

         const filterGranted = contract.filters.AccessGranted(null, account);
         const grantedLogs = await contract.queryFilter(filterGranted);

         const filterRevoked = contract.filters.AccessRevoked(null, account);
         const revokedLogs = await contract.queryFilter(filterRevoked);

         const allLogs = [];
         
         const processLog = async (log, type, color, getDesc) => {
             let blockDate = "Unknown Date";
             try {
                 const blockInfo = await log.getBlock();
                 if (blockInfo) {
                     blockDate = new Date(blockInfo.timestamp * 1000).toLocaleString();
                 }
             } catch(e) {}

             allLogs.push({
                 type, color,
                 desc: getDesc(log.args),
                 time: blockDate,
                 patient: log.args[0],
                 tx: log.transactionHash,
                 blockNum: log.blockNumber
             });
         };

         await Promise.all([
             ...grantedLogs.map(log => processLog(log, 'granted', 'emerald', () => `Authorized Cryptographic Access Scope`)),
             ...revokedLogs.map(log => processLog(log, 'revoked', 'red', () => `Terminated Access Scope`))
         ]);

         allLogs.sort((a, b) => b.blockNum - a.blockNum);
         setEvents(allLogs);
      } catch (err) {
         console.error("Failed fetching block events:", err);
      } finally {
         setLoading(false);
      }
    };

    fetchRealLogs();
  }, [contract, account]);

  const colorMap = {
     emerald: 'bg-emerald-500 outline-emerald-100',
     red: 'bg-red-500 outline-red-100',
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Historical Tracking Activity
         </h2>
         <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none cursor-pointer bg-slate-50 focus:border-emerald-500">
            <option>All Global Events</option>
            <option>Access Grants</option>
         </select>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[300px] relative">
          {loading ? (
              <div className="flex justify-center items-center py-6 h-full">
                 <svg className="animate-spin h-8 w-8 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 block w-full text-center">Scanning Distributed Sequences...</p>
              </div>
          ) : events.length === 0 ? (
              <div className="text-center py-8">
                 <p className="text-slate-500 font-medium text-lg">No interaction records found.</p>
                 <p className="text-slate-400 text-sm mt-1">When a patient shares or revokes record constraints locally, it appears mapped sequentially here natively.</p>
              </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 py-2">
               {events.map((ev, i) => (
                  <div key={i} className="relative pl-8">
                     <div className={`absolute -left-3 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm outline outline-1 ${colorMap[ev.color]}`}></div>
                     <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                           <p className="font-bold text-slate-800 text-lg">{ev.desc}</p>
                           <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wide">
                              {ev.time} <span className="text-slate-300 mx-2">|</span> Scope identity: <span className="font-mono text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">{ev.patient}</span>
                           </p>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm shrink-0 mt-2 md:mt-0">
                           <span className="text-xs font-bold text-slate-400 tracking-wider">BLOCK HASH</span>
                           <span className="text-sm font-mono font-bold text-slate-700">{ev.tx.slice(0, 10)}...{ev.tx.slice(-8)}</span>
                           <a href={`https://sepolia.etherscan.io/tx/${ev.tx}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition">
                             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                           </a>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}
       </div>
    </div>
  )
}
