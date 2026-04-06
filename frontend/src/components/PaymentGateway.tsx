import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface PaymentGatewayProps {
  onSuccess: () => void;
  onCancel: () => void;
  planName: string;
  amount: number;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onSuccess, onCancel, planName, amount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setError(null);
    
    // Simulate network delay
    setTimeout(() => {
      setIsProcessing(false);
      // 90% success rate for simulation
      if (Math.random() > 0.1) {
        setIsSuccess(true);
        setTimeout(() => onSuccess(), 2000);
      } else {
        setError('Your card was declined. Please check your credentials or try another card.');
      }
    }, 2500);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-card-modal glass-card">
        <div className="modal-header">
          <h3 className="neon-text-cyan flex items-center gap-2">
            <CreditCard size={20} />
            Secure Checkout
          </h3>
          <button onClick={onCancel} className="close-btn text-slate-400 hover:text-white">&times;</button>
        </div>

        {isSuccess ? (
          <div className="success-state text-center py-8">
            <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">Payment Successful</h2>
            <p className="text-slate-400 mt-2">Activating {planName} features...</p>
          </div>
        ) : (
          <div className="payment-form mt-4">
            <div className="summary-section bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Selected Plan</span>
                <strong className="text-white">{planName}</strong>
              </div>
              <div className="flex justify-between items-center text-xl font-bold mt-2">
                <span className="text-white">Total due</span>
                <span className="neon-text-cyan">${amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="card-input-grid">
              <label className="text-xs text-slate-400 uppercase tracking-widest mb-1 block">Card Information</label>
              <div className="card-field-group">
                <input 
                  type="text" 
                  placeholder="4242 4242 4242 4242" 
                  className="card-field wide" 
                  readOnly 
                  defaultValue="4242 4242 4242 4242" 
                />
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="MM/YY" className="card-field narrow" readOnly defaultValue="12/26" />
                  <input type="text" placeholder="CVC" className="card-field narrow" readOnly defaultValue="123" />
                </div>
              </div>
            </div>

            {error && (
              <div className="payment-error flex items-center gap-2 text-rose-400 mt-4 text-sm bg-rose-950/20 p-2 rounded border border-rose-900/30">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <button 
              onClick={handleSimulatePayment} 
              disabled={isProcessing}
              className={`pay-button mt-8 w-full ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? 'Processing Transaction...' : (
                <span className="flex items-center justify-center gap-2">
                  Pay Now <ArrowRight size={18} />
                </span>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-4 uppercase tracking-tighter">
              Secured by Antigravity Payment Engine &bull; Non-refundable for SaaS subscriptions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
