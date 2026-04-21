import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

export default function Login() {
  const navigate = useNavigate();
  const { role, loading, connectAndVerifyRole } = useWalletContext();
  const [localErr, setLocalErr] = useState('');
  const [activeBtn, setActiveBtn] = useState(null);

  useEffect(() => {
    if (role === 'patient') navigate('/patient');
    if (role === 'doctor') navigate('/doctor');
    if (role === 'admin') navigate('/admin');
  }, [role, navigate]);

  const handleConnect = async (targetRole) => {
    setLocalErr('');
    setActiveBtn(targetRole);
    const result = await connectAndVerifyRole(targetRole);
    if (!result.success) {
       setLocalErr(result.error);
    }
    setActiveBtn(null);
  };

  const renderLoadingStats = (targetRole) => {
    if (loading && activeBtn === targetRole) {
      return (
        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
        </svg>
      );
    }
    return null;
  };

  const features = [
    {
      title: "Immutable Records",
      desc: "Your medical history is secured on the blockchain, tamper-proof and forever yours.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "Full Privacy",
      desc: "Granular access control. You decide which doctors see your data and for how long.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Instant Access",
      desc: "Emergency ready. Vital health info accessible anywhere in the world instantly.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-6 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight">
            Your Health. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">On-Chain.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Neo-Med: The next generation of Web3 Health Records. Secure, immutable, and patient-owned. Connect your wallet to enter the ecosystem.
          </p>
        </div>

        {/* Role Selection Section */}
        <div className="max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="bg-white/80 backdrop-blur-xl border border-white p-1 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Access Portal</h2>
              <p className="text-slate-500 font-medium font-mono text-sm uppercase tracking-widest">Select your identity focus</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 w-full">
              {/* Patient Card */}
              <button 
                onClick={() => handleConnect('patient')}
                disabled={loading}
                className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 p-8 rounded-3xl transition-all shadow-xl hover:shadow-blue-200 flex flex-col items-center gap-4 text-white disabled:opacity-50"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold">Patient</span>
                  <span className="text-xs text-blue-100 font-medium">View & Manage Records</span>
                </div>
                {renderLoadingStats('patient')}
              </button>

              {/* Doctor Card */}
              <button 
                onClick={() => handleConnect('doctor')}
                disabled={loading}
                className="group relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 p-8 rounded-3xl transition-all shadow-xl hover:shadow-emerald-200 flex flex-col items-center gap-4 text-white disabled:opacity-50"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold">Doctor</span>
                  <span className="text-xs text-emerald-100 font-medium">Verified Medical Access</span>
                </div>
                {renderLoadingStats('doctor')}
              </button>

              {/* Admin Card */}
              <button 
                onClick={() => handleConnect('admin')}
                disabled={loading}
                className="group relative overflow-hidden bg-slate-900 hover:bg-black p-8 rounded-3xl transition-all shadow-xl hover:shadow-slate-300 flex flex-col items-center gap-4 text-white disabled:opacity-50"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12V5a2 2 0 012-2h2a2 2 0 012 2v7m4 0h1a2 2 0 012 2v3a2 2 0 01-2 2h-1m-4 0h-4m-4 0H5a2 2 0 01-2-2v-3a2 2 0 012-2h1" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold">Admin</span>
                  <span className="text-xs text-slate-400 font-medium">Network Infrastructure</span>
                </div>
                {renderLoadingStats('admin')}
              </button>
            </div>

            {localErr && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-bounce">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {localErr}
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24 animate-in fade-in zoom-in-95 duration-1000 delay-300">
          {features.map((f, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="text-center mt-20 text-slate-400 font-medium text-sm">
          <p>Powered by Ethereum & Web3 Technology • Decentralized Identity Protocol</p>
          <div className="flex justify-center gap-6 mt-4">
            <span className="hover:text-blue-600 cursor-pointer transition">Whitepaper</span>
            <span className="hover:text-blue-600 cursor-pointer transition">Security Audit</span>
            <span className="hover:text-blue-600 cursor-pointer transition">Network Status</span>
          </div>
        </div>
      </div>
    </div>
  );
}
