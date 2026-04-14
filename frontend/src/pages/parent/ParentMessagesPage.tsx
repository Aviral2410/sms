import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, ParentWorkspaceResponse, VoiceNoteResponse } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Play, Volume2, Globe, Sparkles, 
  ChevronRight, Calendar, User, Search
} from 'lucide-react';
import { toast } from 'sonner';

const ParentMessagesPage: React.FC = () => {
  const { session } = useStore();
  const [data, setData] = useState<ParentWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<VoiceNoteResponse | null>(null);
  const [targetLang, setTargetLang] = useState('es');

  useEffect(() => {
    if (session.token) {
      loadData();
    }
  }, [session.token]);

  const loadData = async () => {
    try {
      const res = await schoolOpsApi.getMyParentWorkspace();
      setData(res);
      if (res.recentVoiceNotes.length > 0) {
        setSelectedNote(res.recentVoiceNotes[0]);
      }
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const getTranslation = (note: VoiceNoteResponse, lang: string) => {
    if (!note.translations) return null;
    try {
      const trans = JSON.parse(note.translations);
      return trans[lang];
    } catch (e) {
      return null;
    }
  };

  if (loading) return <div className="p-8 text-[#8b95a2] font-medium tracking-tight italic">Decrypting messages...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-100px)]">
      {/* Messages List (Left Sidebar) */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-[#f5efdf] flex items-center gap-3">
            <MessageSquare className="text-[#f59e0b]" />
            Messages
          </h1>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-[#121820] border border-white/5 rounded-xl px-10 py-3 text-sm text-[#f5efdf] placeholder-[#8b95a2] focus:outline-none focus:border-[#f59e0b]/50 transition-all font-medium"
            />
            <Search size={18} className="absolute left-3 top-3.5 text-[#8b95a2]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
          {data?.recentVoiceNotes.map((note) => (
            <motion.div
              key={note.voiceNoteId}
              layoutId={note.voiceNoteId}
              onClick={() => setSelectedNote(note)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedNote?.voiceNoteId === note.voiceNoteId 
                ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex justify-between items-start mb-2 text-[0.65rem] font-bold uppercase tracking-widest">
                <span className={selectedNote?.voiceNoteId === note.voiceNoteId ? 'text-[#f59e0b]' : 'text-[#8b95a2]'}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[#8b95a2]">Voice Note</span>
              </div>
              <h4 className="font-bold text-[#f5efdf] mb-1 line-clamp-1">{note.title}</h4>
              <p className="text-[#8b95a2] text-xs line-clamp-2 leading-relaxed">
                {note.transcript}
              </p>
            </motion.div>
          ))}
          
          {data?.recentVoiceNotes.length === 0 && (
            <div className="p-12 text-center text-[#8b95a2] text-sm">
              No messages found.
            </div>
          )}
        </div>
      </div>

      {/* Message Reader (Main Right) */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {selectedNote ? (
            <motion.div
              key={selectedNote.voiceNoteId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#121820] border border-white/5 rounded-3xl p-8 h-full flex flex-col relative overflow-hidden"
            >
              {/* Note Detail */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#f59e0b]/10 rounded-2xl flex items-center justify-center text-[#f59e0b]">
                    <Volume2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedNote.title}</h2>
                    <div className="flex items-center gap-3 text-[#8b95a2] text-xs font-bold uppercase tracking-widest">
                      <Calendar size={14} className="text-[#f59e0b]" />
                      {new Date(selectedNote.createdAt).toLocaleDateString()}
                      <span className="opacity-20">|</span>
                      <User size={14} className="text-[#f59e0b]" />
                      Teacher
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-6 py-3 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-[#121820] font-black rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95">
                    <Play size={18} fill="currentColor" />
                    Play Note
                  </button>
                </div>
              </div>

              {/* Transcript */}
              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-3 text-[#8b95a2] font-black text-[0.65rem] tracking-[0.2em] mb-4 uppercase">
                    <MessageSquare size={14} />
                    Original Transcript
                  </div>
                  <p className="text-[#f5efdf] text-xl font-medium leading-relaxed font-serif italic">
                    "{selectedNote.transcript}"
                  </p>
                </div>

                {/* Translation Panel */}
                <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3 text-[#f59e0b] font-black text-[0.65rem] tracking-[0.2em] uppercase">
                      <Globe size={16} />
                      AI Dynamic Translation
                    </div>
                    <div className="flex gap-2">
                      {['hi', 'es', 'fr', 'ar'].map(lang => (
                        <button 
                          key={lang}
                          onClick={() => setTargetLang(lang)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            targetLang === lang 
                            ? 'bg-[#f59e0b] text-[#121820]' 
                            : 'bg-white/5 text-[#8b95a2] hover:bg-white/10'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={targetLang}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="min-h-[100px]"
                      >
                        <p className="text-[#f5efdf] text-2xl font-bold leading-snug">
                          {getTranslation(selectedNote, targetLang) || (
                            <span className="text-[#8b95a2] font-medium italic text-lg flex items-center gap-3">
                              <Sparkles size={20} className="animate-pulse" />
                              Generating premium translation for {targetLang}...
                            </span>
                          )}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#f59e0b]/5 blur-[120px] pointer-events-none rounded-full" />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#8b95a2] font-medium border-2 border-dashed border-white/5 rounded-3xl">
              Select a message to view details
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentMessagesPage;
