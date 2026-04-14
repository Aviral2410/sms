import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../contexts/ToastContext';
import { Toast } from './Toast';

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            id={toast.id} 
            message={toast.message} 
            type={toast.type} 
            duration={toast.duration} 
            onClose={removeToast} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
