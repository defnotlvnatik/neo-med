import React, { useState, useEffect, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { bookAppointment, getPatientAppointments, getAuthorizedDoctors, cancelAppointment } from '../utils/contract';

const AppointmentSection = ({ initialTab = 'book' }) => {
    const { contract } = useWalletContext();
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state if initialTab prop changes
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Form states
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');

    const statusColors = {
        0: "bg-amber-100 text-amber-700 border-amber-200", // Pending
        1: "bg-emerald-100 text-emerald-700 border-emerald-200", // Confirmed
        2: "bg-rose-100 text-rose-700 border-rose-200", // Cancelled
        3: "bg-slate-100 text-slate-700 border-slate-200" // Completed
    };

    const statusLabels = {
        0: "Pending",
        1: "Confirmed",
        2: "Cancelled",
        3: "Completed"
    };

    const fetchInitialData = useCallback(async () => {
        if (!contract) return;
        try {
            setFetchLoading(true);
            const [docs, apps] = await Promise.all([
                getAuthorizedDoctors(contract),
                getPatientAppointments(contract)
            ]);
            setDoctors(docs);
            // Sort appointments by date (soonest first)
            setAppointments(apps.slice().sort((a, b) => Number(a.timestamp) - Number(b.timestamp)));
        } catch (error) {
            console.error("Error fetching data:", error);
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

    const handleBook = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !date || !time || !reason) {
            showToast("Please fill in all fields", "error");
            return;
        }

        try {
            setLoading(true);
            const combinedDateTime = new Date(`${date}T${time}`);
            const unixTimestamp = Math.floor(combinedDateTime.getTime() / 1000);
            
            if (unixTimestamp <= Math.floor(Date.now() / 1000)) {
                showToast("Appointment must be in the future", "error");
                setLoading(false);
                return;
            }

            const tx = await bookAppointment(contract, selectedDoctor, unixTimestamp, reason);
            showToast("Transaction submitted...", "success", tx.hash);
            await tx.wait();
            showToast("Appointment booked successfully!", "success", tx.hash);
            
            // Reset form
            setSelectedDoctor('');
            setDate('');
            setTime('');
            setReason('');
            fetchInitialData();
            setActiveTab('mine');
        } catch (error) {
            showToast(error.reason || error.message || "Failed to book appointment", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            setLoading(true);
            const tx = await cancelAppointment(contract, id);
            showToast("Cancelling appointment...", "success", tx.hash);
            await tx.wait();
            showToast("Appointment cancelled successfully", "success", tx.hash);
            fetchInitialData();
        } catch (error) {
            showToast(error.reason || error.message || "Failed to cancel", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    // Helper for 30m slots from 08:00 to 18:00
    const generateTimeSlots = () => {
        const slots = [];
        for (let h = 8; h <= 17; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        slots.push("18:00");
        return slots;
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-8 animate-fade-in relative">
            {/* Header / Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button 
                    onClick={() => setActiveTab('book')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'book' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Book Appointment
                </button>
                <button 
                    onClick={() => setActiveTab('mine')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'mine' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    My Appointments
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'book' ? (
                    <form onSubmit={handleBook} className="max-w-2xl mx-auto space-y-6">
                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Step 1: Pick a Doctor</label>
                            {doctors.length === 0 ? (
                                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                    <p className="text-blue-700 font-bold mb-3">Grant a doctor access first before booking.</p>
                                    <button 
                                        type="button" 
                                        onClick={() => document.getElementById('access-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
                                    >
                                        Go to Provider Access
                                    </button>
                                </div>
                            ) : (
                                <select 
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold bg-white"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    required
                                >
                                    <option value="">Select an authorized provider...</option>
                                    {doctors.map(doc => (
                                        <option key={doc} value={doc}>{`${doc.slice(0, 10)}...${doc.slice(-10)}`}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Step 2: Date</label>
                                <input 
                                    type="date" 
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Step 3: Time</label>
                                <select 
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold bg-white"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    required
                                >
                                    <option value="">Select slot...</option>
                                    {generateTimeSlots().map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Step 4: Reason for Visit</label>
                            <textarea 
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm p-4 h-32 resize-none"
                                placeholder="Brief reason for visit e.g. Fever for 3 days"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={200}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || doctors.length === 0}
                            className={`w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg ${loading ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}`}
                        >
                            {loading ? 'Processing Transaction...' : 'Book Appointment'}
                        </button>
                    </form>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Doctor</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fetchLoading ? (
                                    <tr><td colSpan="5" className="py-20 text-center text-slate-400 italic">Syncing appointments from blockchain...</td></tr>
                                ) : appointments.length === 0 ? (
                                    <tr><td colSpan="5" className="py-20 text-center text-slate-400 italic">No appointments yet</td></tr>
                                ) : (
                                    appointments.map(app => (
                                        <tr key={app.id.toString()} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm">{`${app.doctor.slice(0, 8)}...${app.doctor.slice(-8)}`}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatDateTime(app.timestamp)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={app.reason}>{app.reason}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[app.status]}`}>
                                                    {statusLabels[app.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(app.status === 0 || app.status === 1) && (
                                                    <button 
                                                        onClick={() => handleCancel(app.id)}
                                                        disabled={loading}
                                                        className="text-xs font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {app.status === 3 && (
                                                    <button 
                                                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                                                        onClick={() => document.getElementById('records-tab')?.click()}
                                                    >
                                                        View Records
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Toast Integration */}
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
                            View on Explorer
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppointmentSection;
