import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Link, Book, FileText, Tag, Hash, GraduationCap } from 'lucide-react';
import { schoolOpsApi } from '../../lib/api';
import { toast } from 'sonner';

interface UploadResourceModalProps {
  schoolId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResourceModal({ schoolId, userId, onClose, onSuccess }: UploadResourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    resourceType: 'BOOK',
    authorName: '',
    accessUrl: '',
    description: '',
    subject: '',
    gradeLevel: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await schoolOpsApi.createLibraryResource({
        ...form,
        schoolId,
        uploadedByUserId: userId
      });
      toast.success('Resource uploaded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 500, background: '#121820', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', padding: 32, position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Add Library Resource</h3>
        <p style={{ color: '#8b95a2', fontSize: '0.9rem', marginBottom: 24 }}>Upload books, notes, or external study links for students.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Type</span>
              <select 
                value={form.resourceType} 
                onChange={e => setForm({ ...form, resourceType: e.target.value })}
                style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
              >
                <option value="BOOK">Book (PDF/EPUB)</option>
                <option value="NOTE">Teacher Notes</option>
                <option value="DOCUMENT">Official Document</option>
                <option value="LINK">External Link</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Subject</span>
              <input 
                required
                value={form.subject} 
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Physics"
                style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Title</span>
            <input 
              required
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Resource name"
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Access URL (S3 / External)</span>
            <input 
              required
              value={form.accessUrl} 
              onChange={e => setForm({ ...form, accessUrl: e.target.value })}
              placeholder="https://..."
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Description</span>
            <textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide context for AI and students..."
              rows={3}
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', resize: 'none' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Grade Level</span>
              <input 
                value={form.gradeLevel} 
                onChange={e => setForm({ ...form, gradeLevel: e.target.value })}
                placeholder="Class 10"
                style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Tags</span>
              <input 
                value={form.tags} 
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="calc, jee, math"
                style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }}
              />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: 8, padding: '14px', borderRadius: 14, background: '#6366f1', border: 'none', color: '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Uploading...' : 'Publish to Library'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
