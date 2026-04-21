import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function DoctorOverview({ setTab, navigateToPatient }) {
  const { account, contract } = useWalletContext();
  const [stats, setStats] = useState({
     totalPatients: 0,
     recordsViewed: 0,
     pendingRequests: 0,
     prescriptionsWritten: 0,
  });
  const [activePatients, setActivePatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
       if (!contract || !account) return;
       try {
          setLoading(true);

          // 1. Fetch patients and appointments
          const [grantedEvents, apps] = await Promise.all([
             contract.queryFilter(contract.filters.AccessGranted(null, account)),
             contract.getDoctorAppointments()
          ]);
          
          setAppointments(apps);
          
          // Get unique patient addresses
          const uniquePatients = [...new Set(grantedEvents.map(ev => ev.args[0]))];
          const validPatients = [];
          for(const pAddr of uniquePatients) {
             const isActive = await contract.doctorAccess(pAddr, account);
             if (isActive) validPatients.push(pAddr);
          }

          // Fetch records count for valid patients
          const patientData = await Promise.all(validPatients.map(async (pAddr) => {
             const records = await contract.getPatientRecords(pAddr);
             return {
                 addr: pAddr,
                 name: `${pAddr.slice(0,6)}...${pAddr.slice(-4)}`,
                 records: records.length,
                 color: 'emerald'
             };
          }));

          setActivePatients(patientData);

          // 2. Scan recent activity
          const filterRevoked = contract.filters.AccessRevoked(null, account);
          const revokedEvents = await contract.queryFilter(filterRevoked);

          const allLogs = [];
          const processLog = async (log, type, color, getDesc) => {
             let blockDate = "Just now";
             try {
                const blockInfo = await log.getBlock();
                if (blockInfo) blockDate = new Date(blockInfo.timestamp * 1000).toLocaleString();
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
             ...grantedEvents.map(log => processLog(log, 'grant', 'emerald', (args) => `Granted Framework Access`)),
             ...revokedEvents.map(log => processLog(log, 'revoke', 'red', (args) => `Revoked Framework Access`))
          ]);

          allLogs.sort((a,b) => b.blockNum - a.blockNum);
          setRecentLogs(allLogs.slice(0,3));

          setStats({
             totalPatients: validPatients.length,
             recordsViewed: apps.filter(a => a.status === 3).length, 
             pendingRequests: apps.filter(a => a.status === 0).length,
             prescriptionsWritten: 0 
          });

       } catch (err) {
          console.error("Failed fetching real doctor stats:", err);
       } finally {
          setLoading(false);
       }
    };

    fetchRealData();
  }, [contract, account]);

  const colorMap = {
     blue: 'bg-blue-500 outline-blue-100 text-blue-600 bg-blue-50',
     emerald: 'bg-emerald-500 outline-emerald-100 text-emerald-600 bg-emerald-50',
     red: 'bg-red-500 outline-red-100 text-red-600 bg-red-50',
     purple: 'bg-purple-500 outline-purple-100 text-purple-600 bg-purple-50'
  }

  const upcomingApps = appointments.filter(a => a.status === 0 || a.status === 1)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
    .slice(0, 3);

  return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Provider Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Active Patients</p>
               <p className="text-3xl font-bold text-emerald-600 mt-2">
                  {loading ? <span className="animate-pulse bg-emerald-100 text-transparent rounded w-12 inline-block">00</span> : stats.totalPatients}
               </p>
           </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Records Viewed</p>
               <p className="text-3xl font-bold text-blue-600 mt-2">{stats.recordsViewed}</p>
           </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">Pending Tasks</p>
               <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingRequests}</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 opacity-60">
               <p className="text-slate-400 text-sm font-bold tracking-wide uppercase">Digital Scripts</p>
               <p className="text-xl font-bold text-slate-400 mt-2">Not Deployed</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
           <button onClick={() => setTab('prescription')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-bold shadow transition flex justify-center items-center gap-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Write Prescription
           </button>
           <button onClick={() => setTab('doctor-appointments')} className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-lg font-bold shadow-sm transition flex justify-center items-center gap-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
              View Schedule
           </button>
        </div>

        {/* Quick Schedule Section */}
        {upcomingApps.length > 0 && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="text-xl">📅</span> Upcoming Schedule
                 </h3>
                 <button onClick={() => setTab('doctor-appointments')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Manage Full Schedule</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {upcomingApps.map(app => (
                    <div key={app.id.toString()} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors group">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Patient: {app.patient.slice(0, 10)}...</p>
                       <p className="font-bold text-slate-800 text-sm">{new Date(Number(app.timestamp)*1000).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</p>
                       <p className="text-xs text-slate-500 mt-2 italic line-clamp-1">"{app.reason}"</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Validated Patient List */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[250px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">My Patients</h3>
                 <button onClick={() => setTab('assigned-patients')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition">View All</button>
              </div>
              
              <div className="space-y-4">
                 {loading ? (
                    <div className="flex justify-center items-center py-6 h-full">
                       <svg className="animate-spin h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
                    </div>
                 ) : activePatients.length === 0 ? (
                    <div className="text-center py-8">
                       <p className="text-slate-500 font-medium">No patients have granted you access yet.</p>
                    </div>
                 ) : (
                    activePatients.slice(0, 4).map((p, i) => (
                       <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm`}>0x</div>
                             <div>
                                <p className="font-mono font-bold text-slate-800 text-sm">
                                   {p.addr.slice(0,12)}...
                                </p>
                             </div>
                          </div>
                          <button onClick={() => navigateToPatient(p.addr)} className="text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition">
                             {p.records} Records
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Synchronized Blockchain Activity Log */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[250px] relative">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Recent Blockchain Syncs</h3>
                 <button onClick={() => setTab('activity')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition">Full Timeline</button>
              </div>
              
              {loading ? (
                 <div className="flex justify-center items-center py-6 h-full">
                    <svg className="animate-spin h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
                 </div>
              ) : recentLogs.length === 0 ? (
                 <div className="text-center py-8">
                    <p className="text-slate-500 font-medium">No activity recorded for this provider node yet.</p>
                 </div>
              ) : (
                 <div className="relative border-l border-slate-200 ml-3 space-y-6">
                    {recentLogs.map((log, i) => (
                       <div key={i} className="relative pl-6">
                          <div className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-4 border-white outline outline-1 shadow-sm ${colorMap[log.color].split(' ')[0]} ${colorMap[log.color].split(' ')[1]}`}></div>
                           <p className="font-bold text-slate-800 leading-snug">{log.desc}</p>
                           <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <span>{log.time}</span>
                              <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded tracking-normal normal-case">
                                 Pt: {log.patient.slice(0,6)}...
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
       </div>
   );
}
