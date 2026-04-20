import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit3, X, Save, AlertCircle } from 'lucide-react';

export const FormReview: React.FC<{ 
  title: string; 
  fields: { label: string; name: string; value: any; type?: string }[];
  actionLabel?: string;
  onApprove: (data: any) => void;
}> = ({ title, fields: initialFields, actionLabel = 'Approve & Submit', onApprove }) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    initialFields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {})
  );
  const [editing, setEditing] = useState<string | null>(null);
  const handleSubmit = () => { onApprove(formData); };
  return (
    <div className="bg-[#0a1829] border border-white/10 rounded-2xl overflow-hidden my-6">
      <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-1">{title}</h4>
          <p className="text-[10px] text-white/30 font-bold uppercase">AI Suggested Draft • Review Required</p>
        </div>
        <AlertCircle size={16} className="text-emerald-500/50" />
      </div>
      <div className="p-5 space-y-4">
        {initialFields.map((field) => (
          <div key={field.name} className="group relative">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1.5 px-1">{field.label}</div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${editing === field.name ? 'bg-black/40 border-emerald-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
              {editing === field.name ? (
                <input autoFocus className="flex-1 bg-transparent border-none outline-none text-sm text-emerald-50 font-medium" value={formData[field.name]} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} onBlur={() => setEditing(null)} onKeyDown={(e) => e.key === 'Enter' && setEditing(null)} />
              ) : (
                <div className="flex-1 text-sm text-white/70 font-medium truncate">{formData[field.name] || <span className="text-white/20 italic">Empty</span>}</div>
              )}
              <button onClick={() => setEditing(editing === field.name ? null : field.name)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-emerald-400 transition-colors">
                {editing === field.name ? <Save size={14} /> : <Edit3 size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-emerald-500/5 border-t border-white/5 flex justify-end gap-3">
        <button className="px-4 py-2 rounded-xl text-[11px] font-black uppercase text-white/20 hover:text-rose-400 transition-colors">Discard</button>
        <button onClick={handleSubmit} className="px-5 py-2 rounded-xl bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2">
          <Check size={14} />{actionLabel}
        </button>
      </div>
    </div>
  );
};
