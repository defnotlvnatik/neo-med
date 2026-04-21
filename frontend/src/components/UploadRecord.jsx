import { useState } from 'react';
import { uploadToIPFS } from '../utils/ipfs';
import { encryptFile } from '../utils/crypto';

export default function UploadRecord({ contract, account, refreshData, addTimelineEvent }) {
  const [file, setFile] = useState(null);
  const [recordType, setRecordType] = useState('Prescription');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");

    try {
      setLoading(true);
      setTxHash('');
      
      setStatus('Encrypting file...');
      const encryptedData = await encryptFile(file, account);
      
      setStatus('Uploading to IPFS...');
      const cid = await uploadToIPFS(encryptedData);
      
      setStatus('Waiting for wallet confirmation...');
      const tx = await contract.addRecord(cid, recordType);
      
      setStatus('Processing transaction...');
      setTxHash(tx.hash);
      
      await tx.wait();
      
      setStatus('');
      addTimelineEvent(`Uploaded new ${recordType} record`, 'upload');
      setFile(null);
      refreshData();
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message || 'Upload failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Upload Record</h3>
      
      {status && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 break-words">
          <div className="flex items-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            <p className="font-medium">{status}</p>
          </div>
          {txHash && <p className="text-xs opacity-80 mt-2 font-mono break-all">{txHash}</p>}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4 flex flex-col">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Record Type</label>
          <select 
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option>Prescription</option>
            <option>Lab Report</option>
            <option>Scan</option>
          </select>
        </div>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[150px]"
        >
          <input 
            type="file" 
            id="fileUpload" 
            className="hidden" 
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="fileUpload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-slate-600 font-medium">
              {file ? file.name : "Click or Drag & Drop to upload"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Images, PDFs automatically encrypted</p>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || !file}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Encrypt & Upload Data'}
        </button>
      </form>
    </div>
  );
}
