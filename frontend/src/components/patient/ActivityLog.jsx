import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { ethers } from 'ethers';

export default function ActivityLog() {
  const { account, contract } = useWalletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnChainEvents = async () => {
      if (!contract || !account) return;
      try {
         setLoading(true);

         // We will parse logs from blocks matching our contract
         // 1. Upload Records Event -> RecordAdded(patient, uploader, ipfsHash)
         const filterAdded = contract.filters.RecordAdded(account, null, null);
         const addedLogs = await contract.queryFilter(filterAdded);
         
         // 2. Grant Access -> AccessGranted(patient, doctor)
         const filterGranted = contract.filters.AccessGranted(account, null);
         const grantedLogs = await contract.queryFilter(filterGranted);

         // 3. Revoke Access -> AccessRevoked(patient, doctor)
         const filterRevoked = contract.filters.AccessRevoked(account, null);
         const revokedLogs = await contract.queryFilter(filterRevoked);

         // Formatting logic block fetching actual block timestamps 
         // Since queryFilter returns events natively via ethers, let's normalize them
         const allLogs = [];
         
         const processLog = async (log, type, color, getDesc) => {
             // In pure Frontend fetching, getting block timestamps per log is expensive due to heavy RPC calls
             // We'll map tx data and infer block sequence dynamically via fallback or fetch if provider available
             let blockDate = "Unknown Date";
             try {
                 const blockInfo = await log.getBlock();
                 if (blockInfo) {
                     blockDate = new Date(blockInfo.timestamp * 1000).toLocaleString();
                 }
             } catch(e) {
                 console.log("Could not fetch block timestamp natively");
             }

             // Handle ether v6 return structures where args exist uniquely
             allLogs.push({
                 type,
                 color,
                 desc: getDesc(log.args),
                 time: blockDate,
                 tx: log.transactionHash,
                 blockNum: log.blockNumber
             });
         };

         // Process concurrently relying upon ethers limits
         await Promise.all([
             ...addedLogs.map(log => processLog(log, 'upload', 'blue', (args) => `Uploaded Encrypted Record via Gateway`)),
             ...grantedLogs.map(log => processLog(log, 'grant', 'emerald', (args) => `Authorized Scope to: ${args[1]}`)),
             ...revokedLogs.map(log => processLog(log, 'revoke', 'red', (args) => `Terminated Scope for: ${args[1]}`))
         ]);

         // Sort descendant
         allLogs.sort((a, b) => b.blockNum - a.blockNum);
         setEvents(allLogs);

      } catch (err) {
         console.error("Historical event block sync failed:", err);
      } finally {
         setLoading(false);
      }
    };

    fetchOnChainEvents();
  }, [contract, account]);

  const colorMap = {
     blue: 'bg-blue-500 outline-blue-100',
     emerald: 'bg-emerald-500 outline-emerald-100',
     red: 'bg-red-500 outline-red-100',
     slate: 'bg-slate-500 outline-slate-200'
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Immutable Activity Log History
         </h2>
         <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none cursor-pointer bg-slate-50 focus:border-blue-500">
            <option>All Global Events</option>
            <option>Upload Matrices</option>
            <option>Authorizations Set</option>
         </select>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[300px] relative">
          {loading ? (
              <div className="flex flex-col items-center justify-center p-10 h-full">
                 <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                 </svg>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scanning Blockchain History...</p>
              </div>
          ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 <p className="font-bold text-lg text-slate-600">No transactions synced yet.</p>
                 <p className="text-sm mt-1">Upload records or assign provider access protocols to build history matrix.</p>
              </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 py-2">
               {events.map((ev, i) => (
                  <div key={i} className="relative pl-8">
                     <div className={`absolute -left-3 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm outline outline-1 ${colorMap[ev.color]}`}></div>
                     <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                           <p className="font-bold text-slate-800 text-lg">{ev.desc}</p>
                           <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wide">{ev.time}</p>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm shrink-0">
                           <span className="text-xs font-bold text-slate-400 tracking-wider">BLOCK HASH</span>
                           <span className="text-sm font-mono font-bold text-slate-700 max-w-[150px] overflow-hidden text-ellipsis inline-block" title={ev.tx}>{ev.tx}</span>
                           <a href={`https://sepolia.etherscan.io/tx/${ev.tx}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:bg-blue-100 p-1.5 rounded transition">
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
