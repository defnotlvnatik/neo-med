import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { 
    fetchStats, 
    registerUser, 
    removeUser, 
    checkAddressInfo, 
    fetchRegisteredUsers, 
    fetchActivityLogs, 
    transferAdminAction 
} from '../utils/adminContract';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const Admin = ({ contract: propContract, account: propAccount }) => {
    // Context + Props Harmonization
    const { contract: contextContract, account: contextAccount, disconnect } = useWalletContext();
    const navigate = useNavigate();

    // Use props if available, otherwise context
    const contract = useMemo(() => propContract || contextContract, [propContract, contextContract]);
    const account = useMemo(() => propAccount || contextAccount, [propAccount, contextAccount]);

    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ patients: 0, doctors: 0, records: 0, blocked: 0 });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    
    // Form States
    const [regAddress, setRegAddress] = useState('');
    const [regRole, setRegRole] = useState('patient');
    const [lookupAddress, setLookupAddress] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [newAdminAddress, setNewAdminAddress] = useState('');

    // UI States
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [showWarning, setShowWarning] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const navItems = [
        { id: 'overview', label: 'Dashboard Overview', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
        { id: 'users', label: 'Manage Users', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
        { id: 'activity', label: 'System Logs', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        { id: 'settings', label: 'Admin Settings', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> }
    ];

    /**
     * Load all dashboard data
     */
    const loadDashboardData = useCallback(async (targetContract) => {
        const activeContract = targetContract || contract;
        if (!activeContract) return;
        
        try {
            setStatsLoading(true);
            const provider = activeContract.runner?.provider || activeContract.runner;
            
            // Promise.allSettled is safer than all if one fails
            const [statsRes, usersRes, logsRes] = await Promise.allSettled([
                fetchStats(activeContract),
                fetchRegisteredUsers(activeContract),
                provider ? fetchActivityLogs(activeContract, provider) : Promise.resolve([])
            ]);

            if (statsRes.status === 'fulfilled') setStats(statsRes.value);
            if (usersRes.status === 'fulfilled') setUsers(usersRes.value);
            if (logsRes.status === 'fulfilled') setLogs(logsRes.value);
            
        } catch (error) {
            console.error("Dashboard data load failed:", error);
        } finally {
            setStatsLoading(false);
            setLoading(false);
        }
    }, [contract]);

    /**
     * Initial authentication check
     */
    const checkAccess = useCallback(async () => {
        if (!contract || !account) {
            // Give it a moment to initialize from context
            const timer = setTimeout(() => {
                if (!account) setLoading(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
        
        try {
            const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const hasAccess = await contract.hasRole(DEFAULT_ADMIN_ROLE, account);
            if (hasAccess) {
                setIsAdmin(true);
                await loadDashboardData(contract);
            } else {
                setAccessDenied(true);
                setLoading(false);
            }
        } catch (error) {
            console.error("Access check failed:", error);
            // Don't treat failure as denial immediately if it's a provider error
            if (error.message.includes('network') || error.message.includes('provider')) {
                setStatsLoading(false);
            } else {
                setAccessDenied(true);
            }
            setLoading(false);
        }
    }, [contract, account, loadDashboardData]);

    useEffect(() => {
        checkAccess();
    }, [checkAccess]);

    // Auto-refresh logs every 30 seconds
    useEffect(() => {
        if (!isAdmin || !contract) return;
        const interval = setInterval(async () => {
            try {
                const provider = contract.runner?.provider || contract.runner;
                if (provider) {
                    const l = await fetchActivityLogs(contract, provider);
                    setLogs(l);
                }
            } catch (e) {
                console.warn("Log refresh failed:", e);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [isAdmin, contract]);

    /**
     * Handlers
     */
    const handleRegister = async () => {
        if (!regAddress) return notify("Please enter a wallet address", "error");
        try {
            const tx = await registerUser(contract, regAddress, regRole);
            notify("Registration transaction submitted", "success", tx.hash);
            await tx.wait();
            notify("User registered successfully!", "success", tx.hash);
            setRegAddress('');
            loadDashboardData();
        } catch (error) {
            notify(error.reason || error.message || "Registration failed", "error");
        }
    };

    const handleLookup = async () => {
        if (!lookupAddress) return;
        try {
            const result = await checkAddressInfo(contract, lookupAddress);
            setLookupResult(result);
        } catch (error) {
            notify("User not found or lookup failed", "error");
        }
    };

    const handleRemove = (user) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove User Role",
            message: `Are you sure you want to remove the ${user.role} role from ${user.address}? This cannot be undone.`,
            confirmText: "Remove User",
            onConfirm: async () => {
                try {
                    const tx = await removeUser(contract, user.address, user.role);
                    notify("Removal transaction submitted", "success", tx.hash);
                    setConfirmModal({ isOpen: false });
                    await tx.wait();
                    notify("User removed successfully!", "success", tx.hash);
                    loadDashboardData();
                } catch (error) {
                    notify(error.reason || error.message || "Removal failed", "error");
                    setConfirmModal({ isOpen: false });
                }
            }
        });
    };

    const handleTransferAdmin = () => {
        if (!newAdminAddress) return notify("Please enter new admin address", "error");
        setConfirmModal({
            isOpen: true,
            title: "Transfer Admin Role",
            message: "WARNING: This will transfer full control of the contract to the specified address. You will lose your admin privileges and be signed out.",
            confirmText: "Transfer Admin",
            doubleConfirm: true,
            doubleConfirmMatch: "TRANSFER",
            onConfirm: async () => {
                try {
                    const tx = await transferAdminAction(contract, newAdminAddress);
                    notify("Transfer submitted. You are being logged out...", "success", tx.hash);
                    setConfirmModal({ isOpen: false });
                    await tx.wait();
                    disconnect();
                    navigate('/login');
                } catch (error) {
                    notify(error.reason || error.message || "Transfer failed", "error");
                    setConfirmModal({ isOpen: false });
                }
            }
        });
    };

    const notify = (message, type, hash) => {
        setToast({ message, type, hash });
    };

    // Pagination Logic
    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const renderContent = () => {
        switch(activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Total Patients" value={stats.patients} icon="👤" color="indigo" loading={statsLoading} />
                            <StatCard label="Total Doctors" value={stats.doctors} icon="🩺" color="blue" loading={statsLoading} />
                            <StatCard label="Total Records" value={stats.records} icon="📋" color="emerald" loading={statsLoading} />
                            <StatCard label="Blocked Attempts" value={stats.blocked} icon="🚫" color="rose" loading={statsLoading} />
                        </div>
                        {stats.blocked > 0 && showWarning && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex justify-between items-center shadow-sm animate-bounce-subtle">
                                <div className="flex items-center">
                                    <span className="text-rose-500 mr-3 text-xl">⚠️</span>
                                    <p className="text-rose-800 font-medium">
                                        <span className="font-bold">{stats.blocked}</span> unregistered wallets were blocked. Review the activity log for details.
                                    </p>
                                </div>
                                <button onClick={() => setShowWarning(false)} className="text-rose-400 hover:text-rose-600 p-1">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                             <h2 className="text-xl font-bold text-slate-800 mb-4">Node Health</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                     <div className={`w-3 h-3 ${loading ? 'bg-amber-400' : 'bg-emerald-500'} rounded-full animate-pulse mr-3`}></div>
                                     <span className="text-sm font-medium text-slate-600">Blockchain Sync: {loading ? 'Initializing...' : 'Connected'}</span>
                                 </div>
                                 <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                     <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                                     <span className="text-sm font-medium text-slate-600">Active Role: {isAdmin ? 'System Administrator' : 'Verifying...'}</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <span className="mr-2">➕</span> Register User
                                </h2>
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={regAddress}
                                        onChange={(e) => setRegAddress(e.target.value)}
                                        placeholder="Wallet Address (0x...)"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    />
                                    <select 
                                        value={regRole}
                                        onChange={(e) => setRegRole(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                    >
                                        <option value="patient">Patient</option>
                                        <option value="doctor">Doctor</option>
                                    </select>
                                    <button 
                                        onClick={handleRegister}
                                        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                                    >
                                        Assign Role
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <span className="mr-2">🔍</span> Look Up Address
                                </h2>
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        value={lookupAddress}
                                        onChange={(e) => setLookupAddress(e.target.value)}
                                        placeholder="Enter wallet address"
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    />
                                    <button 
                                        onClick={handleLookup}
                                        className="bg-slate-800 text-white px-6 rounded-xl font-semibold hover:bg-slate-900 transition-all"
                                    >
                                        Check
                                    </button>
                                </div>
                                {lookupResult && (
                                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono text-slate-500">{lookupAddress.slice(0,16)}...</span>
                                            <RoleBadge role={lookupResult.role} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 overflow-hidden">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Registered Users</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Address</th>
                                            <th className="px-4 py-4 text-left">Role</th>
                                            <th className="px-4 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedUsers.map((user) => (
                                            <tr key={user.address} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-sm text-slate-600">{user.address.slice(0, 12)}...</td>
                                                <td className="px-4 py-4"><RoleBadge role={user.role} /></td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleRemove(user)} className="text-rose-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'activity':
                return (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 h-full animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">System Activity Audit</h2>
                        <div className="space-y-4">
                            {logs.length > 0 ? logs.map((log) => (
                                <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                                    <div className={`w-3 h-3 rounded-full bg-${log.color}-500 shadow-[0_0_10px_rgba(0,0,0,0.1)] shadow-${log.color}-200`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{log.type}</p>
                                        <p className="text-xs text-slate-500 font-mono italic">{log.address}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase">{formatRelativeTime(log.timestamp)}</span>
                                </div>
                            )) : (
                                <p className="text-slate-400 italic text-center py-10">No recent activity found or still synced...</p>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="bg-rose-50/50 rounded-3xl p-8 border border-rose-100 animate-fade-in">
                        <div className="flex items-center mb-6">
                            <span className="text-3xl mr-4">⚙️</span>
                            <h2 className="text-2xl font-bold text-slate-800">Administrator Control Panel</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                             <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center">
                                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                 Transfer Contract Ownership
                             </h3>
                             <p className="text-slate-600 text-sm mb-6">
                                 Moving the Administrator role is a permanent action. All existing permissions for your wallet will be revoked immediately upon success.
                             </p>
                             <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={newAdminAddress}
                                        onChange={(e) => setNewAdminAddress(e.target.value)}
                                        placeholder="Enter new admin address"
                                        className="w-full px-5 py-3.5 rounded-2xl border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <button 
                                    onClick={handleTransferAdmin}
                                    className="bg-rose-600 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-rose-700 transition-all uppercase tracking-widest text-xs"
                                >
                                    Confirm Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (loading && !account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="text-slate-400 font-medium animate-pulse">Initializing Secure Session...</p>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <div className="bg-rose-100 p-4 rounded-full mb-6 text-rose-600">🚫</div>
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Access Unauthorized</h1>
                <p className="text-slate-600 mb-6 font-mono text-sm">{account || 'No account detected'}</p>
                <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Back to Login</button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] md:-m-6 bg-slate-50 overflow-hidden animate-fade-in">
            {/* SIDEBAR */}
            <aside className="fixed bottom-0 left-0 right-0 md:relative md:w-[280px] bg-white border-t md:border-t-0 md:border-r border-slate-200 z-40 md:h-full flex-shrink-0 flex flex-col pt-0 md:pt-6 shadow-sm">
                <div className="hidden md:flex flex-col px-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4 mb-1">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-100">
                            AD
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight uppercase tracking-tight">Admin Unit</h3>
                            <p className="font-mono text-[10px] font-bold text-slate-400 mt-0.5">SYST-NODE-001</p>
                        </div>
                    </div>
                </div>

                <nav className="flex md:flex-col justify-around md:justify-start flex-1 px-2 md:px-4 py-2 md:py-6 overflow-y-auto w-full gap-1.5">
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 md:px-4 py-2.5 md:py-3.5 rounded-2xl md:mb-1 transition-all text-[10px] md:text-sm font-bold ${
                                activeTab === item.id 
                                    ? 'text-indigo-700 bg-indigo-50 border-t-2 md:border-t-0 md:border-l-[4px] border-indigo-600' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-l-[4px] border-transparent'
                            }`}
                        >
                            <span className={activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                            <span className="whitespace-nowrap">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="hidden md:block p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
                    <button onClick={disconnect} className="flex items-center gap-3 px-4 py-3 text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 w-full rounded-2xl transition-all font-bold text-xs shadow-sm group">
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Exit Secure Session
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 md:pb-10 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                         <div className="font-mono text-[10px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                            SECURE_ACCESS_GRANTED: {account ? `${account.slice(0,10)}...${account.slice(-10)}` : 'NULL'}
                         </div>
                    </div>
                    {renderContent()}
                </div>
            </main>

            {/* MODALS & TOASTS */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <ConfirmModal 
                {...confirmModal} 
                onCancel={() => setConfirmModal({ isOpen: false })} 
            />
        </div>
    );
};

/**
 * Sub-components
 */
const StatCard = ({ label, value, icon, color, loading }) => {
    // Static mapping for Tailwind classes to prevent purge issues
    const colorMap = {
        indigo: "bg-indigo-100 ring-indigo-50 border-indigo-200 text-indigo-600",
        blue: "bg-blue-100 ring-blue-50 border-blue-200 text-blue-600",
        emerald: "bg-emerald-100 ring-emerald-50 border-emerald-200 text-emerald-600",
        rose: "bg-rose-100 ring-rose-50 border-rose-200 text-rose-600",
        amber: "bg-amber-100 ring-amber-50 border-amber-200 text-amber-600"
    };

    const colorClasses = colorMap[color] || colorMap.indigo;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 group">
            <div className="flex justify-between items-center mb-4">
                <div className={`${colorClasses.split(' ')[0]} p-3 rounded-2xl text-xl group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className={`h-1.5 w-10 ${colorClasses.split(' ')[0]} rounded-full opacity-50`}></div>
            </div>
            <div>
                <p className="text-slate-500 font-medium text-sm mb-1">{label}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div>
                ) : (
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
                )}
            </div>
        </div>
    );
};

const RoleBadge = ({ role }) => {
    let classes = "";
    if (role === 'Patient') classes = "bg-teal-50 text-teal-700 border-teal-100";
    else if (role === 'Doctor') classes = "bg-blue-50 text-blue-700 border-blue-100";
    else classes = "bg-slate-50 text-slate-400 border-slate-100";

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${classes} uppercase tracking-wider`}>
            {role || 'None'}
        </span>
    );
};

const formatRelativeTime = (timestamp) => {
    const diff = (Date.now() - timestamp) / 1000;
    if (isNaN(diff) || diff < 0) return "some time ago";
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return new Date(timestamp).toLocaleDateString();
};

export default Admin;
