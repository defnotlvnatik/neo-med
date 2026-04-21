import React, { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { getAuthorizedPatients, getDoctorAppointments, updateAppointmentStatus, getPatientRecords } from '../utils/contract';

const AssignedPatients = ({ initialTab = 'assigned' }) => {
    const { contract } = useWalletContext();
    const [activeTab, setActiveTab] = useState(initialTab);
    
    // Sync internal tab state if the parent passes a new initialTab
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPatient, setExpandedPatient] = useState(null);
    const [patientRecordsData, setPatientRecordsData] = useState({});
    const [toast, setToast] = useState(null);

    const statusColors = {
        0: "bg-amber-100 text-amber-700 border-amber-200", // Pending
        1: "bg-emerald-100 text-emerald-700 border-emerald-200", // Confirmed
        2: "bg-rose-100 text-rose-700 border-rose-200", // Cancelled
        3: "bg-slate-100 text-slate-700 border-slate-200" // Completed
    };

    const StatusBadge = ({ status }) => {
        const labels = { 0: "Pending", 1: "Confirmed", 2: "Cancelled", 3: "Completed" };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${statusColors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const fetchInitialData = useCallback(async () => {
        if (!contract) return;
        try {
            setFetchLoading(true);
            const [pats, apps] = await Promise.all([
                getAuthorizedPatients(contract),
                getDoctorAppointments(contract)
            ]);
            
            // Map patients to include some basic metadata
            const patientData = await Promise.all(pats.map(async (addr) => {
                const records = await getPatientRecords(contract, addr);
                return {
                    address: addr,
                    recordCount: records.length,
                    lastRecord: records.length > 0 ? records[records.length - 1] : null
                };
            }));

            setPatients(patientData);
            setAppointments(apps);
        } catch (error) {
            console.error("Error fetching doctor data:", error);
        } finally {
            setFetchLoading(false);
        }
    }, [contract]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const showToast = (message, type = 'success', hash = null) => {
        setToast({ message, type, hash });
        setTimeout(() => setToast(null), 6000);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            setLoading(true);
            const tx = await updateAppointmentStatus(contract, id, status);
            showToast("Updating status...", "success", tx.hash);
            await tx.wait();
            showToast("Status updated successfully!", "success", tx.hash);
            fetchInitialData();
        } catch (error) {
            showToast(error.reason || error.message || "Failed to update status", "error");
        } finally {
            setLoading(false);
        }
    };

    const togglePatientRecords = async (patientAddr) => {
        if (expandedPatient === patientAddr) {
            setExpandedPatient(null);
            return;
        }

        setExpandedPatient(patientAddr);
        if (!patientRecordsData[patientAddr]) {
            try {
                const records = await getPatientRecords(contract, patientAddr);
                setPatientRecordsData(prev => ({ ...prev, [patientAddr]: records }));
            } catch (error) {
                console.error("Error fetching patient records:", error);
            }
        }
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const filteredPatients = patients.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Group appointments
    const upcoming = appointments.filter(a => a.status === 0 || a.status === 1).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    const past = appointments.filter(a => a.status === 2 || a.status === 3).sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-8 animate-fade-in">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button 
                    onClick={() => setActiveTab('assigned')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Assigned Patients
                </button>
                <button 
                    onClick={() => setActiveTab('apps')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'apps' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Appointments
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'assigned' ? (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search patients by address..." 
                                className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>

                        {fetchLoading ? (
                            <div className="py-20 text-center italic text-slate-400">Loading authorized patient data...</div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="py-20 text-center italic text-slate-400">No patients have granted you access yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPatients.map(p => (
                                    <div key={p.address} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/20">
                                        <div className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black">
                                                    0x
                                                </div>
                                                <div>
                                                    <p className="font-mono text-sm font-bold text-slate-800">{`${p.address.slice(0, 12)}...${p.address.slice(-12)}`}</p>
                                                    <div className="flex gap-4 mt-1">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{p.recordCount} Total Records</span>
                                                        {p.lastRecord && <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600">Last Sync: {p.lastRecord.recordType} ({new Date(Number(p.lastRecord.timestamp)*1000).toLocaleDateString()})</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => togglePatientRecords(p.address)}
                                                    className="bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    {expandedPatient === p.address ? 'Hide Data' : 'View Records'}
                                                </button>
                                                <div className="group relative">
                                                    <span className="text-[10px] font-bold text-slate-400 cursor-help flex items-center gap-1">
                                                        Revoke Access (Patient Controlled)
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedPatient === p.address && (
                                            <div className="bg-white p-6 border-t border-slate-100 animate-slide-down">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                                            <tr>
                                                                <th className="px-4 py-3">Type</th>
                                                                <th className="px-4 py-3">Date</th>
                                                                <th className="px-4 py-3 text-right">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {!patientRecordsData[p.address] ? (
                                                                <tr><td colSpan="3" className="py-4 text-center italic text-slate-400">Loading full history...</td></tr>
                                                            ) : patientRecordsData[p.address].length === 0 ? (
                                                                <tr><td colSpan="3" className="py-4 text-center italic text-slate-400">No records found for this patient.</td></tr>
                                                            ) : (
                                                                patientRecordsData[p.address].map((rec, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="px-4 py-3 text-sm font-bold text-slate-700">{rec.recordType}</td>
                                                                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(Number(rec.timestamp)*1000).toLocaleDateString()}</td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <a 
                                                                                href={`https://gateway.pinata.cloud/ipfs/${rec.ipfsHash}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className="text-[10px] font-black uppercase text-emerald-600 hover:underline"
                                                                            >
                                                                                Open IPFS
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Upcoming */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Upcoming Schedule
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcoming.length === 0 ? (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 italic">No upcoming appointments</div>
                                ) : (
                                    upcoming.map(app => (
                                        <div key={app.id.toString()} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative group transition-all hover:bg-white hover:shadow-lg">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{app.patient}</div>
                                                <StatusBadge status={app.status} />
                                            </div>
                                            <div className="mb-4">
                                                <p className="text-sm font-black text-slate-800 leading-tight">{formatDateTime(app.timestamp)}</p>
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic" title={app.reason}>"{app.reason}"</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {app.status === 0 && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(app.id, 1)}
                                                        disabled={loading}
                                                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-slate-300"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {app.status === 1 && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(app.id, 3)}
                                                        disabled={loading}
                                                        className="flex-1 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-300"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleUpdateStatus(app.id, 2)}
                                                    disabled={loading}
                                                    className={`py-2 px-4 border border-rose-200 text-rose-600 text-[10px] font-black uppercase rounded-xl hover:bg-rose-50 transition-all ${app.status === 0 ? 'flex-1' : ''}`}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Past */}
                        {past.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Archive & History</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                                    {past.map(app => (
                                        <div key={app.id.toString()} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{app.patient}</div>
                                                <StatusBadge status={app.status} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600">{formatDateTime(app.timestamp)}</p>
                                            <p className="text-xs text-slate-400 mt-1 truncate italic">"{app.reason}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Toast */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-[100] p-6 rounded-2xl shadow-2xl flex flex-col gap-2 max-w-sm border animate-slide-in ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
                        <p className="font-bold text-sm">{toast.message}</p>
                    </div>
                    {toast.hash && (
                        <a 
                            href={`https://sepolia.etherscan.io/tx/${toast.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono bg-black/20 p-2 rounded-xl border border-white/10 hover:bg-black/30 transition-all flex items-center justify-between"
                        >
                            Explorer Link
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssignedPatients;
