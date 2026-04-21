import React, { useState, useEffect, useRef } from 'react';
import { useWalletContext } from '../context/WalletContext';

const EMERGENCY_KEYWORDS = [
  "chest pain", "can't breathe", "difficulty breathing", "stroke",
  "seizure", "heart attack", "unconscious", "severe bleeding"
];

const QUICK_CHIPS = ["Headache & fever", "Sore throat", "Stomach pain", "Dizziness", "Persistent cough"];

const SymptomChat = () => {
  const { account, contract } = useWalletContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', hash: string, message: string }
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const checkEmergency = (text) => {
    const lowerText = text.toLowerCase();
    const found = EMERGENCY_KEYWORDS.some(kw => lowerText.includes(kw));
    setIsEmergency(found);
    return found;
  };

  const handleSend = async (textOverride) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    if (!API_KEY) {
      setError("Check your VITE_GEMINI_API_KEY in .env");
      return;
    }

    const newUserMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    setSaveStatus(null);
    checkEmergency(messageText);

    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `You are a compassionate medical assistant in a patient's health records portal.
            When a patient describes symptoms:
            1. Acknowledge with empathy
            2. List possible conditions from most to least likely in plain language
            3. Suggest safe home remedies or OTC treatments
            4. State clearly when they MUST see a doctor urgently
            5. Ask one follow-up question to understand better
            6. Always end with: "Would you like me to note these symptoms in your health records?"
            Never prescribe prescription medications. Keep language simple.
            Flag emergencies immediately.` }]
          },
          contents: updatedMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to get response from AI");
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      setMessages([...updatedMessages, { role: 'ai', content: aiResponse }]);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setIsEmergency(false);
    setSaveStatus(null);
  };

  const handleSaveToRecords = async (content) => {
    if (!account || !contract) {
      setError("Connect wallet to save symptoms to your records");
      return;
    }

    try {
      setSaveStatus({ message: "Preparing transaction..." });
      const timestamp = Date.now();
      const ipfsHash = `symptom-log-${timestamp}`;
      const recordType = "Symptom Log";

      const tx = await contract.addRecord(ipfsHash, recordType);
      setSaveStatus({ message: "Transaction pending...", hash: tx.hash });
      
      await tx.wait();
      setSaveStatus({ type: 'success', message: "Saved to blockchain successfully!", hash: tx.hash });
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.reason || err.message || "Transaction failed" });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.297A2.497 2.497 0 0013.5 21.75c1.38 0 2.5-1.12 2.5-2.5V5.882a2.5 2.5 0 00-5 0z" />
              <circle cx="11" cy="4" r="2" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Symptom Checker</h3>
            <p className="text-[10px] uppercase tracking-widest font-black text-teal-600 opacity-80">AI Medical Assistant</p>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
          title="Clear Conversation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3 animate-pulse">
          <span className="text-xl">🚨</span>
          <p className="text-red-700 text-sm font-bold">
            This sounds like a medical emergency. Call 911 or go to the ER immediately.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#FBFBFE]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-10">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-3xl shadow-sm">🩺</div>
            <h4 className="font-bold text-slate-800 text-lg">How are you feeling today?</h4>
            <p className="text-slate-500 text-sm leading-relaxed">Describe your symptoms and I'll help you understand what might be happening.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] group ${m.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div className={`
                p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                ${m.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}
              `}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
              
              {m.role === 'ai' && m.content.toLowerCase().includes("note these symptoms") && (
                <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button 
                    onClick={() => handleSaveToRecords(m.content)}
                    disabled={saveStatus?.type === 'success' || (saveStatus && !saveStatus.type)}
                    className={`
                      text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2
                      ${saveStatus?.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100'}
                      disabled:opacity-70
                    `}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {saveStatus?.type === 'success' ? 'Saved' : 'Save to my records'}
                  </button>
                  
                  {saveStatus?.hash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${saveStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-slate-400 hover:text-teal-600 underline"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none flex gap-1">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        {saveStatus?.type === 'error' && (
           <div className="text-rose-500 text-[10px] font-bold px-4">{saveStatus.message}</div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CHIPS.map(chip => (
            <button 
              key={chip}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="text-[11px] font-bold px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full hover:bg-teal-50 hover:text-teal-700 hover:border-teal-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {!account && (
          <p className="text-[10px] text-amber-600 font-bold mb-2 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Connect wallet to save symptoms to your records
          </p>
        )}

        <div className="relative flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-[24px] p-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/5 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            maxLength={500}
            placeholder="Type your symptoms here..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm p-2 resize-none max-h-32 min-h-[44px]"
            rows={Math.min(3, input.split('\n').length || 1)}
          />
          <div className="flex flex-col items-end gap-2 pb-1 pr-1">
            {input.length > 400 && (
              <span className={`text-[10px] font-bold ${input.length >= 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                {input.length}/500
              </span>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center hover:bg-teal-700 transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
            >
              <svg className="w-5 h-5 fill-current rotate-45 transform -translate-x-0.5" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChat;
