import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';

export default function MyRecords() {
  const { account, contract } = useWalletContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real on-chain records scoped to this exact connected user block
  useEffect(() => {
    const fetchRealRecords = async () => {
      if (!contract || !account) return;
      
      try {
        setLoading(true);
        // Direct ABI execution calling EHR.sol
        const data = await contract.getPatientRecords(account);
        
        const mappedRecords = data.map(record => ({
           cid: record.ipfsHash,
           type: record.recordType || 'General Record',
           name: `${record.recordType || 'Encrypted'} Document`,
           date: new Date(Number(record.timestamp) * 1000).toLocaleString(),
           uploader: record.uploader
        }));
        
        // Reverse array ensuring most recent syncs surface atop the matrix
        setRecords(mappedRecords.reverse());
      } catch (err) {
        console.error("RPC Error fetching blockchain records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealRecords();
  }, [contract, account]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          My Medical Records
        </h2>
        <div className="flex gap-3">
           <select className="border border-slate-200 rounded-lg px-4 py-2 font-medium text-sm outline-none focus:border-blue-500 bg-slate-50 cursor-pointer">
             <option>All Document Types</option>
             <option>Prescription</option>
             <option>Lab Report</option>
             <option>Scan / Output</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] relative">
         {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                  </svg>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Syncing On-Chain Data...</p>
               </div>
            </div>
         ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
               <p className="font-bold text-lg text-slate-600">No encrypted records deployed yet.</p>
               <p className="text-sm mt-1">Upload files through the secure module tool to map them to your identity.</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8FAFC] border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Document Details</th>
                    <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">On-Chain Mapping Hooks</th>
                    <th className="p-4 text-slate-500 font-bold tracking-wide text-right uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {records.map((r, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 text-base">{r.name}</p>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">{r.type} <span className="opacity-50 mx-1">•</span> {r.date}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-4 font-mono font-bold text-xs text-slate-600">
                          <div className="flex items-center gap-2 mb-1.5">
                             <span className="w-10 inline-block text-slate-400">IPFS:</span> 
                             <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 select-all max-w-[150px] overflow-hidden text-ellipsis inline-block" title={r.cid}>{r.cid}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="w-10 inline-block text-slate-400">TX:</span> 
                             <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 select-all max-w-[150px] overflow-hidden text-ellipsis inline-block" title={r.uploader}>{r.uploader}</span>
                          </div>
                       </td>
                       <td className="p-4 text-right">
                          <button className="text-blue-600 font-bold hover:text-blue-800 px-4 py-2 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200 mr-2">
                             View Module
                          </button>
                          <button className="text-slate-600 font-bold hover:text-slate-800 px-4 py-2 hover:bg-slate-100 rounded-lg transition border border-slate-200 shadow-sm">
                             Share IPFS CID
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
