import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface PaymentGatewayProps {
  onSuccess: () => Promise<void> | void;
  onCancel: () => void;
  planName: string;
  amount: number;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ onSuccess, onCancel, planName, amount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirmPayment = async () => {
    if (!acknowledged) {
      setError('Please confirm authorization before continuing.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      await onSuccess();
      setIsSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Payment confirmation failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
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
              <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">Authorization</label>
              <label className="flex items-start gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm that this plan update is authorized for this school account and billing cycle.
                </span>
              </label>
            </div>

            {error && (
              <div className="payment-error flex items-center gap-2 text-rose-400 mt-4 text-sm bg-rose-950/20 p-2 rounded border border-rose-900/30">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <button 
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className={`pay-button mt-8 w-full ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? 'Applying Plan Update...' : (
                <span className="flex items-center justify-center gap-2">
                  Confirm & Continue <ArrowRight size={18} />
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
