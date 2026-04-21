import { useState, useEffect } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { decryptFile } from '../../utils/crypto';

export default function PatientRecords({ selectedPatient, setSelectedPatient }) {
  const { account, contract } = useWalletContext();
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [viewingFile, setViewingFile] = useState(null); // Track which CID is being decrypted

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

  useEffect(() => {
     const fetchPatientEVMRecords = async () => {
         if (!contract || !selectedPatient) return;
         try {
             setFetchingRecords(true);
             const data = await contract.getPatientRecords(selectedPatient);
             
             const mappedRecords = data.map(record => ({
                 cid: record.ipfsHash,
                 type: record.recordType || 'Medical Output',
                 name: `${record.recordType || 'Encrypted'} Document`,
                 date: new Date(Number(record.timestamp) * 1000).toLocaleString(),
                 uploader: record.uploader
             }));
             
             setRecords(mappedRecords.reverse());
         } catch(err) {
             console.error("Access restriction hit rendering medical forms:", err);
             setRecords([]);
         } finally {
             setFetchingRecords(false);
         }
     }
     fetchPatientEVMRecords();
  }, [contract, selectedPatient]);

  const handleViewFile = async (cid, type) => {
    try {
      setViewingFile(cid);
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (!res.ok) throw new Error("Fetch failed");
      const encryptedBlob = await res.blob();
      
      // Using the selectedPatient address as the decryption key (matches EHR Demo Security Model)
      const decryptedBlob = await decryptFile(encryptedBlob, selectedPatient);
      
      // Map common record types to extensions if they aren't detected in MIME
      const extensionMap = {
        'Prescription': '.pdf',
        'Lab Report': '.pdf',
        'Scan': '.jpg',
        'Medical Output': '.pdf'
      };
      const extension = extensionMap[type] || '.pdf';
      const fileName = `Decrypted_${type.replace(/\s+/g, '_')}_${selectedPatient.slice(0, 6)}${extension}`;

      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Decryption failed. Verify patient address mapping.");
    } finally {
      setViewingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
          Patient Records
        </h2>
        <div className="flex gap-3 w-full md:w-auto">
           {loading ? (
               <div className="text-sm font-bold text-emerald-600 animate-pulse bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">Syncing active mappings...</div>
           ) : (
             <select 
               value={selectedPatient || ''} 
               onChange={(e) => setSelectedPatient(e.target.value)}
               className="w-full md:w-64 border border-slate-200 rounded-lg px-4 py-2 font-bold text-sm outline-none focus:border-emerald-500 bg-slate-50 cursor-pointer"
             >
               <option value="">Select Target Identity Block...</option>
               {patients.map((p, i) => (
                  <option key={i} value={p}>ID: {p.slice(0,6)}...{p.slice(-4)}</option>
               ))}
             </select>
           )}
        </div>
      </div>

      {!selectedPatient ? (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 text-slate-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
            <p className="text-xl font-bold text-slate-600">No Patient Block Selected</p>
            <p className="text-slate-500 font-medium mt-1">Please select an authorized patient from the dropdown mapping array above.</p>
         </div>
      ) : (
         <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Active Diagnostic Constraint Key</p>
                  <p className="font-mono text-emerald-900 font-bold mt-1 md:text-lg text-sm bg-white border border-emerald-200 rounded px-2">{selectedPatient}</p>
               </div>
               <div className="flex gap-4">
                  <select className="border border-emerald-200 rounded-md px-3 py-1.5 text-sm font-bold bg-white outline-none">
                     <option>All Event Types</option>
                  </select>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] relative">
              {fetchingRecords ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                         <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                         </svg>
                         <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Selected Array...</p>
                      </div>
                  </div>
              ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <p className="font-bold text-lg text-slate-600">No encrypted records deployed yet.</p>
                      <p className="text-sm mt-1">This patient has mapped no records locally.</p>
                  </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Diagnostic File Data</th>
                        <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">EVM Verification Blocks</th>
                        <th className="p-4 text-slate-500 font-bold tracking-wide text-right uppercase text-xs">Secure Retrieval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {records.map((r, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-emerald-600 flex items-center justify-center shadow-sm">
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
                                 <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 max-w-[150px] overflow-hidden text-ellipsis inline-block" title={r.cid}>{r.cid}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="w-10 inline-block text-slate-400">TX:</span> 
                                 <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 max-w-[150px] overflow-hidden text-ellipsis inline-block" title={r.uploader}>{r.uploader}</span>
                              </div>
                           </td>
                           <td className="p-4 text-right">
                              <button 
                                onClick={() => handleViewFile(r.cid, r.type)}
                                disabled={!!viewingFile}
                                className="text-white font-bold bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-end gap-2 ml-auto"
                              >
                                 {viewingFile === r.cid ? (
                                   <>
                                     <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                                     </svg>
                                     Decrypting...
                                   </>
                                 ) : (
                                   "View Buffer File"
                                 )}
                              </button>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
         </>
      )}
    </div>
  )
}
