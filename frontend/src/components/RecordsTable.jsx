import { useState } from 'react';
import { decryptFile } from '../utils/crypto';

export default function RecordsTable({ records, account }) {
  const [decrypting, setDecrypting] = useState(false);

  const handleView = async (cid, type) => {
    try {
      setDecrypting(true);
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (!res.ok) throw new Error("Fetch failed");
      const encryptedBlob = await res.blob();
      
      const decryptedBlob = await decryptFile(encryptedBlob, account);
      
      // Determine extension based on type
      const extensionMap = {
        'Prescription': '.pdf',
        'Lab Report': '.pdf',
        'Scan': '.jpg',
        'Medical Output': '.pdf'
      };
      const extension = extensionMap[type] || '.pdf';
      const fileName = `MyDecrypted_${type.replace(/\s+/g, '_')}_Record${extension}`;

      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Decryption failed. Ensure you are connected with the owner wallet.");
    } finally {
      setDecrypting(false);
    }
  };

  const copyCID = (cid) => {
    navigator.clipboard.writeText(cid);
    // Silent fail/success for smoother UI
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">My Uploaded Records</h3>
      
      {records.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No records deployed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4 rounded-tl-lg">Type</th>
                <th className="p-4">Upload Date</th>
                <th className="p-4">CID</th>
                <th className="p-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-800">{rec.recordType}</td>
                  <td className="p-4 text-slate-500">{new Date(rec.timestamp * 1000).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">
                    {rec.ipfsHash.slice(0,8)}...{rec.ipfsHash.slice(-6)}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button 
                      onClick={() => handleView(rec.ipfsHash, rec.recordType)}
                      disabled={decrypting}
                      className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {decrypting ? '...' : 'View'}
                    </button>
                    <button 
                      onClick={() => copyCID(rec.ipfsHash)}
                      className="text-slate-500 hover:text-slate-800 transition pl-2 border-l border-slate-200"
                      title="Copy CID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
