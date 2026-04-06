import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader, X, Volume2, Sparkles } from 'lucide-react';
import { mcpApi } from '../lib/mcp';
import { useStore } from '../store/useStore';

interface VoiceCommandProps {
  onClose: () => void;
  onResult?: (transcript: string) => void;
  autoStart?: boolean;
}

type State = 'idle' | 'listening' | 'processing' | 'responding';

export function VoiceCommand({ onClose, onResult, autoStart }: VoiceCommandProps) {
  const { session } = useStore();
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Waveform animation
  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (analyser) {
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#22d3ee';
      ctx.beginPath();
      buf.forEach((v, i) => {
        const x = (i / buf.length) * canvas.width;
        const y = (v / 128.0) * (canvas.height / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else {
      // Idle animation — gentle sine wave
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = state === 'idle' ? 'rgba(71,85,105,0.5)' : '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const t = Date.now() / 800;
      for (let x = 0; x < canvas.width; x++) {
        const amp = state === 'listening' ? 20 : 4;
        const y = canvas.height / 2 + Math.sin(x / 30 + t) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    animRef.current = requestAnimationFrame(drawWave);
  }, [state]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawWave);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawWave]);

  const startListening = async () => {
    setError(''); setTranscript(''); setResponse('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Browser does not support voice input. Try Chrome.'); return; }

    // Start mic access for waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch { /* waveform unavailable but voice still works */ }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState('listening');
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(t);
      transcriptRef.current = t;
    };
    recognition.onend = async () => {
      analyserRef.current = null;
      const finalTranscript = transcriptRef.current;
      if (!finalTranscript) { setState('idle'); return; }
      
      setState('processing');
      
      if (onResult) {
        // Smooth transition to transcribing state
        setTimeout(() => {
          onResult(finalTranscript);
          onClose();
        }, 1200);
        return;
      }

      try {
        const res = await mcpApi.callTool('ask_school_data', {
          role: session.role?.toLowerCase() || 'school_admin',
          question: finalTranscript,
        });
        const data = JSON.parse(res.content[0].text);
        setResponse(data.answer || data.result || JSON.stringify(data));
        setState('responding');
        // TTS
        const utt = new SpeechSynthesisUtterance(data.answer || 'Done');
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      } catch {
        setResponse('I couldn\'t process that query. Please try again.');
        setState('responding');
      }
    };
    recognition.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); };

  useEffect(() => {
    if (autoStart) {
      setTimeout(() => startListening(), 300);
    }
    return () => { recognitionRef.current?.stop(); cancelAnimationFrame(animRef.current); };
  }, [autoStart]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
        style={{ width: '100%', maxWidth: 500, background: '#080d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={18} /></button>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>AI Voice Interface</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', margin: 0, letterSpacing: '-0.02em' }}>Speak to ElevateSmart</h2>
        </div>

        {/* Orb */}
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={state === 'listening' ? { scale: [1, 1.15, 1], boxShadow: ['0 0 30px rgba(34,211,238,0.3)', '0 0 60px rgba(34,211,238,0.6)', '0 0 30px rgba(34,211,238,0.3)'] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ width: 100, height: 100, borderRadius: '50%', background: state === 'listening' ? 'linear-gradient(135deg,#0e7490,#22d3ee)' : state === 'processing' ? 'linear-gradient(135deg,#4f46e5,#818cf8)' : state === 'responding' ? 'linear-gradient(135deg,#065f46,#34d399)' : 'linear-gradient(135deg,#1e293b,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: state === 'idle' || state === 'responding' ? 'pointer' : 'default', boxShadow: '0 0 40px rgba(0,0,0,0.4)' }}
            onClick={state === 'idle' || state === 'responding' ? startListening : undefined}>
            {state === 'idle' && <Mic size={38} color="#94a3b8" />}
            {state === 'listening' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><Mic size={38} color="#fff" /></motion.div>}
            {state === 'processing' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader size={38} color="#a5b4fc" /></motion.div>}
            {state === 'responding' && <Volume2 size={38} color="#34d399" />}
          </motion.div>
        </div>

        {/* Waveform */}
        <div style={{ width: '100%', height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Status / transcript */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          {state === 'idle' && <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>Tap the orb or press <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 7px', fontSize: '0.75rem', color: '#94a3b8' }}>Space</kbd> to speak</p>}
          {state === 'listening' && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, animation: 'pulse 2s infinite' }}>Listening...</div>
              {transcript ? <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px' }}>"{transcript}"</p> : <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 12px' }}>Speak clearly into your microphone</p>}
              <button onClick={stopListening} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <MicOff size={13} style={{ display: 'inline', marginRight: 6 }} />Stop
              </button>
            </div>
          )}
          {state === 'processing' && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Transcribing...</div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>"{transcript}"</p>
            </div>
          )}
          {state === 'responding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '16px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))', border: '1px solid rgba(52,211,153,0.15)', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Sparkles size={14} color="#34d399" /><span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Response</span></div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{response}</p>
              </div>
              <button onClick={startListening} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Mic size={13} /> Ask another question
              </button>
            </div>
          )}
          {error && <p style={{ color: '#fb7185', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
