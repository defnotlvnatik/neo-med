import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function DashboardOverview({ setTab }) {
  const { account, contract } = useWalletContext();
  const [stats, setStats] = useState({
     totalRecords: 0,
     authorizedDocs: 0,
     pendingRequests: 0,
     lastActivity: 'Loading...'
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      if (!contract || !account) return;
      try {
         setLoading(true);

         // 1. Fetch Total Records natively
         const records = await contract.getPatientRecords(account);
         const totalRecords = records.length;

         // 2. Fetch Authorized Doctors dynamically scanning mappings natively
         const filterGranted = contract.filters.AccessGranted(account, null);
         const grantedEvents = await contract.queryFilter(filterGranted);
         const uniqueDocs = [...new Set(grantedEvents.map(ev => ev.args[1]))];
         let activeDoctors = 0;
         for (const doc of uniqueDocs) {
            const isActive = await contract.doctorAccess(account, doc);
            if (isActive) activeDoctors++;
         }

         // 3. Scan recent blockchain activity for timelines & last activity metric
         const filterAdded = contract.filters.RecordAdded(account, null, null);
         const addedLogs = await contract.queryFilter(filterAdded);

         const filterRevoked = contract.filters.AccessRevoked(account, null);
         const revokedLogs = await contract.queryFilter(filterRevoked);

         // Flatten logs safely via ethers event signatures
         const allLogs = [];
         
         const processLog = async (log, type, color, getDesc) => {
             let blockDate = "Pending Confirmation";
             try {
                 const blockInfo = await log.getBlock();
                 if (blockInfo) {
                     // Keep track of exact timestamp for relative sorting natively
                     blockDate = new Date(blockInfo.timestamp * 1000).toLocaleString();
                 }
             } catch(e) {
                 console.log("Could not parse timestamp");
             }

             allLogs.push({
                 type, color, 
                 desc: getDesc(log.args),
                 time: blockDate,
                 tx: log.transactionHash,
                 blockNum: log.blockNumber
             });
         };

         await Promise.all([
             ...addedLogs.map(log => processLog(log, 'upload', 'blue', () => `Encrypted Record Mapped`)),
             ...grantedEvents.map(log => processLog(log, 'grant', 'emerald', (args) => `Authorized Provider: ${args[1].slice(0,6)}...`)),
             ...revokedLogs.map(log => processLog(log, 'revoke', 'red', (args) => `Severed Access: ${args[1].slice(0,6)}...`))
         ]);

         // Sort and slice top 3
         allLogs.sort((a, b) => b.blockNum - a.blockNum);
         const recent3 = allLogs.slice(0, 3);
         setRecentLogs(recent3);

         // Resolve Last Activity string
         let lastActiveStr = 'No On-Chain Activity';
         if (recent3.length > 0) lastActiveStr = recent3[0].time;

         setStats({
            totalRecords,
            authorizedDocs: activeDoctors,
            pendingRequests: 0, // Not explicitly tracked natively within EHR.sol
            lastActivity: lastActiveStr
         });

      } catch (err) {
         console.error("Dashboard overview stat synchronization dropped:", err);
      } finally {
         setLoading(false);
      }
    };

    fetchOverviewStats();
  }, [contract, account]);

  const colorMap = {
     blue: 'bg-blue-500 outline-blue-100 text-blue-600 bg-blue-50',
     emerald: 'bg-emerald-500 outline-emerald-100 text-emerald-600 bg-emerald-50',
     red: 'bg-red-500 outline-red-100 text-red-600 bg-red-50',
     slate: 'bg-slate-500 outline-slate-200 text-slate-600 bg-slate-50'
  }

  return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Stat Cards strictly mapping stateful updates */}
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Total Records</p>
               <p className="text-3xl font-bold text-blue-600 mt-2">
                 {loading ? <span className="animate-pulse bg-blue-100 text-transparent rounded w-12 inline-block">00</span> : stats.totalRecords}
               </p>
           </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Authorized Doctors</p>
               <p className="text-3xl font-bold text-emerald-600 mt-2">
                 {loading ? <span className="animate-pulse bg-emerald-100 text-transparent rounded w-12 inline-block">00</span> : stats.authorizedDocs}
               </p>
           </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Pending Requests</p>
               <p className="text-3xl font-bold text-amber-500 mt-2">
                 {loading ? <span className="animate-pulse bg-amber-100 text-transparent rounded w-12 inline-block">00</span> : stats.pendingRequests}
               </p>
           </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Last Activity</p>
               <p className="text-sm font-bold text-slate-700 mt-3 whitespace-nowrap overflow-hidden text-ellipsis">
                 {loading ? <span className="animate-pulse bg-slate-100 text-transparent rounded w-24 inline-block">Loading...</span> : stats.lastActivity}
               </p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <button onClick={() => setTab('upload')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold shadow transition flex justify-center items-center gap-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Upload New Record
           </button>
           <button onClick={() => setTab('access')} className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-lg font-bold shadow-sm transition flex justify-center items-center gap-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Manage Access Constraints
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[150px] relative">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Blockchain Syncs</h3>
              <button onClick={() => setTab('activity')} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">View Full Timeline</button>
           </div>
           
           {loading ? (
               <div className="flex justify-center items-center py-6">
                 <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                 </svg>
               </div>
           ) : recentLogs.length === 0 ? (
               <div className="text-center py-8">
                  <p className="text-slate-500 font-medium">No activity recorded for this identity yet.</p>
               </div>
           ) : (
               <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  {recentLogs.map((log, i) => (
                     <div key={i} className="relative pl-6">
                        <div className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-4 border-white outline outline-1 shadow-sm ${colorMap[log.color].split(' ')[0]} ${colorMap[log.color].split(' ')[1]}`}></div>
                        <p className="font-bold text-slate-800">{log.desc}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                           <span>{log.time}</span>
                           <span className={`font-mono px-2 py-0.5 rounded ${colorMap[log.color].split(' ')[2]} ${colorMap[log.color].split(' ')[3]}`}>
                              Tx: {log.tx.slice(0,6)}...{log.tx.slice(-4)}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
           )}
        </div>
      </div>
  );
}
