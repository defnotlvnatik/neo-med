import React, { useEffect, useState } from 'react';

const Toast = ({ message, type, txHash, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 8000); // 8 seconds for tx visibility

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
    const icon = type === 'success' ? (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center transition-all duration-300 transform animate-slide-in`}>
            {icon}
            <div className="flex flex-col">
                <span className="font-semibold">{message}</span>
                {txHash && (
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white underline text-sm mt-1"
                    >
                        View on Etherscan
                    </a>
                )}
            </div>
            <button onClick={() => setVisible(false)} className="ml-4 hover:bg-white/20 p-1 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
