import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Command as CmdIcon, LogOut, Settings } from 'lucide-react';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/40">
      <div 
        className="fixed inset-0" 
        onClick={() => setOpen(false)} 
      />
      <Command 
        className="relative w-full max-w-xl bg-[#0f1522] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/5 gap-3">
          <Search size={18} className="text-white/40" />
          <Command.Input 
            autoFocus 
            placeholder="Type a command or search..." 
            className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-base"
          />
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 bg-white/5 px-2 py-1 rounded">
            <CmdIcon size={12} /> K
          </div>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-white/40">No results found.</Command.Empty>

          <Command.Group heading={<span className="px-2 text-[10px] font-black uppercase tracking-widest text-white/30">AI Assistant</span>}>
            <Command.Item 
              onSelect={() => {
                // Dispatch event to open Aura
                window.dispatchEvent(new CustomEvent('aura:toggle'));
                setOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer text-white/80 transition-colors mt-1"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
                <Sparkles size={14} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Ask Aura</div>
                <div className="text-xs text-emerald-400/60">Analyze operations, resolve issues, or get insights</div>
              </div>
            </Command.Item>
          </Command.Group>

          <Command.Group heading={<span className="px-2 text-[10px] font-black uppercase tracking-widest text-white/30 mt-3 block">Navigation</span>}>
            <Command.Item 
              onSelect={() => { navigate('/dashboard'); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors mt-1"
            >
              <Settings size={14} />
              <span className="text-sm">Dashboard Settings</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => { window.dispatchEvent(new CustomEvent('auth:logout')); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 cursor-pointer text-rose-400/80 hover:text-rose-400 transition-colors mt-1"
            >
              <LogOut size={14} />
              <span className="text-sm">Sign out</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
};
