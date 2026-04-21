import { useState, useRef } from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { encryptFile } from '../../utils/crypto';
import { uploadToIPFS } from '../../utils/ipfs';

export default function UploadRecord() {
  const { account, contract } = useWalletContext();
  
  const [file, setFile] = useState(null);
  const [recordType, setRecordType] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    setError('');
    setSuccess('');
    
    if (!recordType) {
      setError("Please select a record type.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!contract || !account) {
      setError("Wallet not connected properly.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Encrypt File
      setStatus("Encrypting file locally (AES-256-GCM)...");
      const encryptedFile = await encryptFile(file, account);
      
      // 2. Upload to IPFS via Pinata
      setStatus("Uploading to decentralized IPFS storage...");
      const ipfsHash = await uploadToIPFS(encryptedFile);
      
      // 3. Write to Blockchain
      setStatus("Awaiting MetaMask transaction approval...");
      const tx = await contract.addRecord(ipfsHash, recordType);
      
      setStatus("Confirming transaction on blockchain... Please wait.");
      await tx.wait(); // Wait for 1 block confirmation

      setSuccess(`Record successfully mapped to identity! TX: ${tx.hash}`);
      setFile(null);
      setRecordType('');
      setNotes('');
      if(fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "An error occurred during upload.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Upload Encrypted Record
       </h2>
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
             <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Record Classification Type</label>
               <select 
                 value={recordType}
                 onChange={(e) => setRecordType(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium bg-slate-50 cursor-pointer"
               >
                 <option value="">Select Type...</option>
                 <option value="Prescription">Prescription</option>
                 <option value="Lab Report">Lab Report</option>
                 <option value="Scan">Scan (MRI/X-Ray)</option>
                 <option value="Discharge Summary">Discharge Summary</option>
                 <option value="Other">Other</option>
               </select>
             </div>

             <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Secure File Attachment</label>
               <input 
                 type="file" 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
               />
               
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}
                 className={`border-2 border-dashed ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50/50'} rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer group`}
               >
                  <div className={`w-14 h-14 ${file ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'} shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  </div>
                  <p className="font-bold text-slate-700 text-lg">
                    {file ? file.name : 'Drag & Drop your secure file'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB Selected` : 'Auto-encrypts .pdf, .jpg, .png'}
                  </p>
               </div>
             </div>

             <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Optional Contextual Notes</label>
               <textarea 
                 rows="3" 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Add descriptive context for authorized providers..." 
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50"
               ></textarea>
             </div>

             <div className="pt-6 border-t border-slate-100">
               {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium border border-red-200 text-center">{error}</div>}
               {success && <div className="mb-4 text-emerald-700 bg-emerald-50 p-3 rounded-lg text-sm font-medium border border-emerald-200 text-center overflow-hidden text-ellipsis">{success}</div>}
               {status && (
                 <div className="mb-4 text-blue-700 bg-blue-50 p-3 rounded-lg text-sm font-bold border border-blue-200 flex items-center justify-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path></svg>
                   {status}
                 </div>
               )}

               <button 
                 type="button" 
                 onClick={handleUpload}
                 disabled={loading}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-50"
               >
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                 Encrypt & Broadcast to IPFS Network
               </button>
               <p className="text-center text-xs text-slate-400 font-bold tracking-wide mt-4 flex items-center justify-center gap-1 uppercase bg-slate-50 py-2 rounded-lg">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 Your file is AES-256 encrypted locally before network egress.
               </p>
             </div>
          </form>
       </div>
    </div>
  )
}
