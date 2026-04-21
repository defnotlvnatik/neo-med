import { useState } from 'react';

export default function AccessRequests() {
  const dummyRequests = [
    { address: '0x88F2...4E12', date: 'Just now', status: 'Pending', pulse: 'bg-amber-500' },
    { address: '0x1A2B...9C8D', date: 'Oct 14, 2023', status: 'Approved', pulse: 'bg-emerald-500' },
    { address: '0x992B...C1A4', date: 'Sep 10, 2023', status: 'Rejected', pulse: 'bg-red-500' }
  ];

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          Outbound Access Requests
       </h2>
       
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Request New Node Access</h3>
          <div className="space-y-4 max-w-3xl">
             <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Patient Target Ethereum Address</label>
                <input type="text" placeholder="0x..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-700 bg-slate-50" />
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Access Justification</label>
                <textarea rows="2" placeholder="Reason for requesting constraints access..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-slate-50"></textarea>
             </div>
             <div className="pt-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition whitespace-nowrap w-full md:w-auto">
                   Dispatch Access Request Signal
                </button>
                <p className="text-xs text-slate-500 font-medium mt-3">Target identity will receive signature requirement directly on their hub.</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 p-6 border-b border-slate-100">Dispatched Signal Timeline</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8FAFC] border-b border-slate-200">
                 <tr>
                   <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Patient Identity Hash</th>
                   <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Request Initiated</th>
                   <th className="p-4 text-slate-500 font-bold tracking-wide uppercase text-xs">Status Frame</th>
                   <th className="p-4 text-slate-500 font-bold tracking-wide text-right uppercase text-xs">Resolutions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {dummyRequests.map((req, i) => (
                   <tr key={i} className="hover:bg-slate-50 transition">
                     <td className="p-4 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                          {req.address}
                        </span>
                     </td>
                     <td className="p-4 text-slate-500 font-medium">{req.date}</td>
                     <td className="p-4">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm border ${
                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                       }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${req.pulse} animate-pulse`}></span>
                         {req.status}
                       </span>
                     </td>
                     <td className="p-4 text-right">
                       {req.status === 'Approved' && <button className="text-emerald-700 font-bold px-4 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition">View Records</button>}
                       {req.status === 'Pending' && <button className="text-slate-600 font-bold px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md transition">Cancel</button>}
                       {req.status === 'Rejected' && <span className="text-slate-400 font-bold italic pr-4">Terminated</span>}
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  )
}
