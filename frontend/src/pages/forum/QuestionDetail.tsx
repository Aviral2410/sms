import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, 
  Flag, Send, Clock, User, Award, 
  ChevronUp, ChevronDown, MoreVertical, 
  SendHorizonal, Brain, AlertCircle
} from 'lucide-react';
import { 
  schoolOpsApi, ForumQuestionResponse, 
  ForumAnswerResponse 
} from '../../lib/api';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';

const COLOR = '#6366f1';

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useStore();
  
  const [question, setQuestion] = useState<ForumQuestionResponse | null>(null);
  const [answers, setAnswers] = useState<ForumAnswerResponse[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const feed = await schoolOpsApi.getForumFeed();
      const q = feed.find(x => x.questionId === id);
      if (q) {
        setQuestion(q);
        const ans = await schoolOpsApi.getForumAnswers(id);
        setAnswers(ans);
      } else {
        toast.error('Question not found');
        navigate('/forum');
      }
    } catch (err) {
      toast.error('Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleVote = async (targetId: string, type: number) => {
    try {
      await schoolOpsApi.voteForum({
        targetId,
        voteType: type
      });
      toast.success('Vote recorded');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to vote');
    }
  };

  const handleFlag = async (targetId: string) => {
    const reason = prompt('Reason for flagging?');
    if (!reason) return;
    try {
      await schoolOpsApi.flagForum({
        targetId,
        reason
      });
      toast.success('Reported for moderation');
    } catch (err) {
      toast.error('Failed to flag');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !id) return;

    setSubmitting(true);
    try {
      await schoolOpsApi.answerForumQuestion({
        questionId: id,
        content: newAnswer
      });
      toast.success('Answer submitted! Analyzing for academic quality...');
      setNewAnswer('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Check your content for academic relevance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCorrect = async (answerId: string) => {
    try {
      await schoolOpsApi.markAnswerCorrect(answerId);
      toast.success('Marked as correct! Points awarded.');
      fetchData();
    } catch (err) {
      toast.error('Failed to mark correct');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '40px 0' }}>
         <div style={{ height: 200, borderRadius: 24, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
         <div style={{ height: 100, borderRadius: 24, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!question) return null;

  const isAuthor = question.authorId === (session as any).userId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 100, maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Navigation */}
      <button 
        onClick={() => navigate('/forum')}
        style={{ width: 'fit-content', background: 'none', border: 'none', color: '#475569', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'color 0.2s' }}>
        <ArrowLeft size={16} /> Back to Forum
      </button>

      {/* Main Question Card */}
      <div style={{ padding: 40, borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
         <div style={{ display: 'flex', gap: 32 }}>
            {/* Vote Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
               <button onClick={() => handleVote(question.questionId, 1)} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}><ChevronUp size={24} /></button>
               <span style={{ fontSize: '1.25rem', fontWeight: 900, color: COLOR }}>{question.upvotes}</span>
               <button onClick={() => handleVote(question.questionId, -1)} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}><ChevronDown size={24} /></button>
            </div>

            <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                 <div style={{ padding: '6px 14px', borderRadius: 10, background: `${COLOR}15`, border: `1px solid ${COLOR}25`, color: COLOR, fontSize: '0.75rem', fontWeight: 800 }}>{question.subject || 'GENERAL'}</div>
                 <span style={{ fontSize: '0.8rem', color: '#475569' }}>Asked by <strong style={{ color: '#fff' }}>{question.authorName}</strong> • {new Date(question.createdAt).toLocaleDateString()}</span>
               </div>
               <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.03em' }}>{question.title}</h1>
               <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#8b95a2', whiteSpace: 'pre-wrap', marginBottom: 32 }}>{question.content}</div>
               
               <div style={{ display: 'flex', gap: 16 }}>
                 <button onClick={() => handleFlag(question.questionId)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><Flag size={14} /> Report</button>
               </div>
            </div>
         </div>
      </div>

      {/* Answers Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
             <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>{answers.length} Answers</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {answers.map(ans => (
               <motion.div 
                 key={ans.answerId} 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 style={{ padding: 32, borderRadius: 28, background: ans.isCorrect ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.01)', border: `1px solid ${ans.isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)'}`, display: 'flex', gap: 24 }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                     <button onClick={() => handleVote(ans.answerId, 1)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><ChevronUp size={20} /></button>
                     <span style={{ fontSize: '1rem', fontWeight: 900, color: ans.isCorrect ? '#10b981' : '#fff' }}>{ans.upvotes}</span>
                     {ans.isCorrect && <CheckCircle size={24} color="#10b981" fill="rgba(16,185,129,0.1)" style={{ marginTop: 8 }} />}
                  </div>

                  <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><User size={16} /></div>
                           <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{ans.authorName}</div>
                              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>{new Date(ans.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                        {isAuthor && !ans.isCorrect && (
                          <button 
                            onClick={() => handleMarkCorrect(ans.answerId)}
                            style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <CheckCircle size={14} /> Mark Correct
                          </button>
                        )}
                        {ans.isCorrect && (
                          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                             <Award size={14} /> Solved Question
                          </div>
                        )}
                     </div>
                     <div style={{ fontSize: '1rem', lineHeight: 1.6, color: '#8b95a2' }}>{ans.content}</div>
                  </div>
               </motion.div>
             ))}
          </div>
      </div>

      {/* Your Answer Card */}
      <div style={{ padding: 40, borderRadius: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
             <MessageSquare size={18} color={COLOR} /> Your Answer
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#8b95a2', margin: '0 0 24px' }}>Help your peers solve this academic challenge.</p>
          
          <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <textarea 
               value={newAnswer}
               onChange={e => setNewAnswer(e.target.value)}
               placeholder="Write your comprehensive answer here..."
               rows={6}
               style={{ padding: '20px', borderRadius: 20, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
             />
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#475569' }}>
                   <Brain size={16} />
                   <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Strict academic moderation applies</span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={submitting || !newAnswer.trim()}
                  style={{ padding: '12px 28px', borderRadius: 14, background: `linear-gradient(135deg, ${COLOR}, #8b5cf6)`, border: 'none', color: '#fff', fontWeight: 900, fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                   {submitting ? 'Submitting...' : <><SendHorizonal size={18} /> POST ANSWER</>}
                </motion.button>
             </div>
          </form>
      </div>

    </div>
  );
}
