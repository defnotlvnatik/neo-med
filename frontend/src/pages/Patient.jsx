import { useState } from 'react';
import DashboardOverview from '../components/patient/DashboardOverview';
import MyRecords from '../components/patient/MyRecords';
import UploadRecord from '../components/patient/UploadRecord';
import AccessControl from '../components/patient/AccessControl';
import ActivityLog from '../components/patient/ActivityLog';
import SymptomChat from '../components/SymptomChat';
import AppointmentSection from '../components/AppointmentSection';
import { useWalletContext } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { account, disconnect } = useWalletContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnect();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { id: 'records', label: 'My Medical Records', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg> },
    { id: 'ai-checker', label: 'AI Medical Assistant', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
    { id: 'book-appointment', label: 'Book Clinical Visit', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { id: 'my-schedule', label: 'My Medical Schedule 📅', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg> },
    { id: 'upload', label: 'Upload Module Tool', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> },
    { id: 'access', label: 'Provider Access Map', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { id: 'activity', label: 'Blockchain Activity', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <DashboardOverview setTab={setActiveTab} />;
      case 'records': return <MyRecords />;
      case 'ai-checker': return <SymptomChat />;
      case 'book-appointment': return <AppointmentSection initialTab="book" />;
      case 'my-schedule': return <AppointmentSection initialTab="mine" />;
      case 'upload': return <UploadRecord />;
      case 'access': return <AccessControl />;
      case 'activity': return <ActivityLog />;
      default: return <DashboardOverview setTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:-m-6 bg-[#F3F4F6] overflow-hidden">
      {/* Sidebar - Desktop Fixed, Mobile Bottom */}
      <aside className="fixed bottom-0 left-0 right-0 md:relative md:w-[260px] bg-white border-t md:border-t-0 md:border-r border-slate-200 z-40 md:h-full flex-shrink-0 flex flex-col pt-0 md:pt-6 shadow-[1px_0_10_rgba(0,0,0,0.02)]">
        
        {/* Patient Identity Block (Visible strictly Desktop) */}
        <div className="hidden md:flex flex-col px-6 pb-6 border-b border-slate-100">
           <div className="flex items-center gap-4 mb-1">
               <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-sm outline outline-2 outline-blue-200 outline-offset-2">
                  {account ? '0x' : '--'}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Patient Node</h3>
                  <p className="font-mono text-xs font-bold text-slate-500 mt-1">
                     {account ? `${account.slice(0,6)}...${account.slice(-4)}` : '0x...'}
                  </p>
               </div>
           </div>
        </div>

        {/* Global Navigation Engine */}
        <nav className="flex md:flex-col justify-around md:justify-start flex-1 px-2 md:px-4 py-2 md:py-6 overflow-y-auto w-full gap-1">
          {navItems.map(item => (
            <button 
              key={item.id}
              id={`${item.id}-tab`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:mb-1 transition-all text-[10px] md:text-[13px] font-bold ${
                activeTab === item.id 
                  ? 'text-blue-600 bg-blue-50 md:bg-blue-50 border-t-2 md:border-t-0 md:border-l-[3px] border-blue-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-t-2 md:border-t-0 md:border-l-[3px] border-transparent'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Action Bottom Scope Component */}
        <div className="hidden md:block p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 w-full rounded-xl transition-colors font-bold text-sm shadow-sm group">
             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 group-hover:-translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
             Disconnect Boundary
           </button>
        </div>
      </aside>

      {/* Primary Dynamic Content Frame Engine */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 w-full bg-[#F3F4F6]">
         <div className="max-w-5xl mx-auto pb-4">
           {renderContent()}
         </div>
      </main>
    </div>
  );
}
