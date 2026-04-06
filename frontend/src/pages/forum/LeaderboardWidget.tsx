import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, TrendingUp, Trophy, Star, 
  Target, Zap, Flame, Crown, Medal
} from 'lucide-react';
import { schoolOpsApi, ForumLeaderboardEntry } from '../../lib/api';
import { useStore } from '../../store/useStore';

const COLOR = '#f59e0b'; // Amber

export default function LeaderboardWidget() {
  const { session } = useStore();
  const [entries, setEntries] = useState<ForumLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('WEEKLY');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!session.schoolId) return;
      setLoading(true);
      try {
        const data = await schoolOpsApi.getForumLeaderboard(session.schoolId!, period);
        setEntries(data.entries);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [session.schoolId, period]);

  return (
    <div style={{ padding: 24, borderRadius: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `${COLOR}20`, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Trophy size={20} color={COLOR} />
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>School Leaders</h3>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
          {['WEEKLY', 'MONTHLY'].map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p as any)}
              style={{ padding: '6px 12px', fontSize: '0.65rem', fontWeight: 800, border: 'none', background: period === p ? 'rgba(255,255,255,0.05)' : 'none', color: period === p ? '#fff' : '#475569', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          [1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ height: 50, borderRadius: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : entries.slice(0, 5).map((entry, index) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={entry.userId} 
            style={{ padding: '12px 16px', borderRadius: 18, background: index === 0 ? `${COLOR}05` : 'rgba(255,255,255,0.01)', border: `1px solid ${index === 0 ? `${COLOR}20` : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            
            {/* Rank */}
            <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
              {index === 0 ? <Crown size={16} color={COLOR} /> : 
               index === 1 ? <Medal size={16} color="#e2e8f0" /> : 
               index === 2 ? <Medal size={16} color="#b45309" /> : 
               <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>{index + 1}</span>}
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: index === 0 ? '#fff' : '#e2e8f0', marginBottom: 2 }}>{entry.fullName}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{entry.roleName}</div>
            </div>

            {/* Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: index === 0 ? COLOR : '#fff', letterSpacing: '-0.02em' }}>{entry.points}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>pts</div>
            </div>
          </motion.div>
        ))}

        {!loading && entries.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <Zap size={24} color="#475569" style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>Leaderboard will update soon</p>
          </div>
        )}
      </div>

      <button style={{ width: '100%', padding: '12px', marginTop: 12, borderRadius: 14, background: 'none', border: '1px solid rgba(255,255,255,0.05)', color: '#8b95a2', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
        View Full Rankings
      </button>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
