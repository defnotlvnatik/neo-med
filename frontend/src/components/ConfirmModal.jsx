import React, { useState } from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", doubleConfirm = false, doubleConfirmMatch = "" }) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const isConfirmDisabled = doubleConfirm && inputValue !== doubleConfirmMatch;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all animate-scale-in">
                <div className="flex items-center mb-4">
                    <div className="bg-rose-100 p-2 rounded-full mr-4">
                        <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                </div>
                
                <p className="text-slate-600 mb-6 leading-relaxed">
                    {message}
                </p>

                {doubleConfirm && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-600">"{doubleConfirmMatch}"</span> to proceed
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={doubleConfirmMatch}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            setInputValue('');
                        }}
                        disabled={isConfirmDisabled}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                            isConfirmDisabled 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
