import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const colors = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/20 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  const Icon = icons[type];

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      layout
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl
        min-w-[300px] max-w-md pointer-events-auto
        ${colors[type]}
      `}
    >
      <div className="flex-shrink-0">
        <Icon size={20} />
      </div>
      
      <div className="flex-grow font-bold text-sm tracking-tight leading-relaxed">
        {message}
      </div>

      <button 
        onClick={() => onClose(id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
      >
        <X size={16} />
      </button>

      {/* Progress line */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 opacity-30 ${
          type === 'success' ? 'bg-emerald-500' : 
          type === 'error' ? 'bg-red-500' : 
          type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
        } rounded-full`}
      />
    </motion.div>
  );
};
