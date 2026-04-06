import React, { useState, useRef } from 'react';
import { Mic, Square, Send, Trash2, Volume2, Sparkles, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { schoolOpsApi } from '../../lib/api';
import { toast } from 'sonner';

interface VoiceNoteControlProps {
  onClose: () => void;
  targetUserId?: string;
  audience?: string;
}

const VoiceNoteControl: React.FC<VoiceNoteControlProps> = ({ onClose, targetUserId, audience = 'PARENTS' }) => {
  const { session } = useStore();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Mock transcript generation
        setTranscript("Hello, I wanted to discuss the recent performance. The student is showing great progress in mathematics but needs a bit more focus on literature assignments.");
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.info("Recording started...");
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = async () => {
    if (!session.schoolId) return;
    setLoading(true);
    try {
      await schoolOpsApi.createVoiceNote({
        schoolId: session.schoolId,
        relatedUserId: targetUserId,
        audience,
        title: "Update from Teacher",
        transcript,
        audioUrl: audioUrl || '',
      });
      toast.success("Voice note sent successfully with AI translation!");
      onClose();
    } catch (error) {
      toast.error("Failed to send voice note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-8 right-8 w-[400px] bg-[#121820] border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#a78bfa] to-[#818cf8] p-4 flex items-center justify-between text-[#121820]">
        <div className="flex items-center gap-2">
          <Volume2 size={20} />
          <h3 className="font-black text-sm uppercase tracking-widest">AI Voice Messenger</h3>
        </div>
        <button onClick={onClose} className="hover:rotate-90 transition-transform">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {!audioUrl ? (
          <div className="flex flex-col items-center py-8 gap-6 text-center">
            <div className="relative">
              {recording && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-[#fb7185] rounded-full blur-2xl" 
                />
              )}
              <button 
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  recording ? 'bg-[#fb7185] scale-110' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {recording ? <Square size={32} fill="currentColor" /> : <Mic size={32} className="text-[#a78bfa]" />}
              </button>
            </div>
            
            <div className="space-y-1">
              <p className="text-[#f5efdf] font-bold text-lg">{recording ? "Awaiting your voice..." : "Tap to record"}</p>
              <p className="text-[#8b95a2] text-xs font-medium uppercase tracking-wider">{recording ? "Recording in progress" : "Ready to transmit"}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#34d399] font-black text-[0.65rem] tracking-[0.2em] uppercase">
                <Sparkles size={14} />
                AI Transcript Ready
              </div>
              <button 
                onClick={() => { setAudioUrl(null); setTranscript(''); }}
                className="text-[#fb7185] hover:bg-[#fb7185]/10 p-2 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[#f5efdf] text-sm leading-relaxed italic">"{transcript}"</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['es', 'hi', 'fr'].map(l => (
                  <div key={l} className="w-6 h-6 rounded-full border-2 border-[#121820] bg-white/10 flex items-center justify-center text-[0.5rem] font-black uppercase text-[#a78bfa]">{l}</div>
                ))}
              </div>
              <span className="text-[#8b95a2] text-[0.6rem] font-bold uppercase tracking-widest flex items-center gap-1">
                <Globe size={10} /> translations pending send
              </span>
            </div>

            <button 
              disabled={loading}
              onClick={handleSend}
              className="w-full py-4 bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-[#121820] font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={20} />
              {loading ? "TRANSMITTING..." : "SEND TO PARENTS"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceNoteControl;
