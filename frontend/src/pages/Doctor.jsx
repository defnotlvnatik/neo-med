import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import DoctorOverview from '../components/doctor/DoctorOverview';
import MyPatients from '../components/doctor/MyPatients';
import PatientRecords from '../components/doctor/PatientRecords';
import WritePrescription from '../components/doctor/WritePrescription';
import AccessRequests from '../components/doctor/AccessRequests';
import DoctorActivityLog from '../components/doctor/DoctorActivityLog';
import AssignedPatients from '../components/AssignedPatients';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { account, disconnect } = useWalletContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnect();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Doctor Overview', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { id: 'assigned-patients', label: 'Assigned Patients', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
    { id: 'doctor-appointments', label: 'Appointments 📅', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg> },
    { id: 'records', label: 'Raw Record Lookup', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg> },
    { id: 'prescription', label: 'Digital RX Tool', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
    { id: 'activity', label: 'Audit Trail', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
  ];

  const navigateToPatient = (patientAddress) => {
     setSelectedPatient(patientAddress);
     setActiveTab('records');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <DoctorOverview setTab={setActiveTab} navigateToPatient={navigateToPatient} />;
      case 'assigned-patients': return <AssignedPatients initialTab="assigned" />;
      case 'doctor-appointments': return <AssignedPatients initialTab="apps" />;
      case 'records': return <PatientRecords selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />;
      case 'prescription': return <WritePrescription selectedPatient={selectedPatient} />;
      case 'activity': return <DoctorActivityLog />;
      default: return <DoctorOverview setTab={setActiveTab} navigateToPatient={navigateToPatient} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:-m-6 bg-[#F3F4F6] overflow-hidden">
      <aside className="fixed bottom-0 left-0 right-0 md:relative md:w-[260px] bg-white border-t md:border-t-0 md:border-r border-slate-200 z-40 md:h-full flex-shrink-0 flex flex-col pt-0 md:pt-6 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        
        <div className="hidden md:flex flex-col px-6 pb-6 border-b border-slate-100">
           <div className="flex items-center gap-4 mb-1">
               <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm outline outline-2 outline-emerald-200 outline-offset-2">
                  {account ? '0x' : '--'}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Provider Node</h3>
                  <p className="font-mono text-xs font-bold text-slate-500 mt-1">
                     {account ? `${account.slice(0,6)}...${account.slice(-4)}` : '0x...'}
                  </p>
               </div>
           </div>
        </div>

        <nav className="flex md:flex-col justify-around md:justify-start flex-1 px-2 md:px-4 py-2 md:py-6 overflow-y-auto w-full gap-1">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:mb-1 transition-all text-xs md:text-[13.5px] font-bold ${
                activeTab === item.id 
                  ? 'text-emerald-700 bg-emerald-50 md:bg-emerald-50 border-t-2 md:border-t-0 md:border-l-[3px] border-emerald-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-t-2 md:border-t-0 md:border-l-[3px] border-transparent'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden md:block p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 w-full rounded-xl transition-colors font-bold text-sm shadow-sm group">
             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 group-hover:-translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
             Disconnect Provider
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 w-full bg-[#F3F4F6]">
         <div className="max-w-5xl mx-auto pb-4">
           {renderContent()}
         </div>
      </main>
    </div>
  );
}
