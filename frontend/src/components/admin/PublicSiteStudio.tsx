import React, { useEffect, useState } from 'react';
import { AlertCircle, ImagePlus, Loader, Save, Sparkles, UploadCloud } from 'lucide-react';
import {
  publicSiteApi,
  type PublicRoleBenefit,
  type PublicSectionMedia,
  type PublicSiteContentResponse,
  type PublicSiteFeatureCard,
  type PublicTestimonial,
} from '../../lib/publicSiteApi';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

const PANEL_STYLE: React.CSSProperties = {
  padding: 28,
  borderRadius: 24,
  background: 'linear-gradient(160deg, rgba(15,23,42,0.78), rgba(2,6,23,0.86))',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  letterSpacing: '0.11em',
  fontWeight: 800,
  color: '#64748b',
  marginBottom: 8,
  display: 'block',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  outline: 'none',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 128,
  resize: 'vertical',
};

function createEmptyFeatureCard(sortOrder: number): PublicSiteFeatureCard {
  return {
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    accentColor: '#22d3ee',
    sortOrder,
    bullets: [''],
  };
}

function createEmptyRoleBenefit(): PublicRoleBenefit {
  return {
    roleKey: '',
    roleLabel: '',
    headline: '',
    description: '',
    accentColor: '#ffb663',
    outcomes: [''],
  };
}

function createFallbackMedia(sectionKey: string): PublicSectionMedia {
  const defaultImage = sectionKey === 'hero'
    ? '/operational-viewpoint.svg'
    : '/institution-flow.svg';
  return {
    sectionKey,
    imageUrl: '',
    fallbackImageUrl: defaultImage,
    altText: '',
    caption: '',
  };
}

function createEmptyTestimonial(sortOrder: number): PublicTestimonial {
  return {
    quote: '',
    authorName: '',
    authorRole: '',
    organization: '',
    avatarUrl: '',
    accentColor: '#22d3ee',
    sortOrder,
  };
}

function normalizeContent(content: PublicSiteContentResponse): PublicSiteContentResponse {
  const mediaGallery = content.mediaGallery || [];
  const mediaMap = new Map(mediaGallery.map((item) => [item.sectionKey, item]));
  return {
    ...content,
    mediaGallery: ['hero', 'story', 'founder'].map((key) => mediaMap.get(key) || createFallbackMedia(key)),
    featureCards: content.featureCards?.length ? content.featureCards : [createEmptyFeatureCard(1)],
    roleBenefits: content.roleBenefits?.length ? content.roleBenefits : [createEmptyRoleBenefit()],
    testimonials: content.testimonials?.length ? content.testimonials : [createEmptyTestimonial(1)],
  };
}

function fileKeyForFeature(index: number, feature: PublicSiteFeatureCard) {
  const order = feature.sortOrder ?? index + 1;
  return `public-site-feature-${order}`;
}

function imagePreview(url: string) {
  return url || '/institution-flow.svg';
}

function fileKeyForTestimonial(index: number, testimonial: PublicTestimonial) {
  const order = testimonial.sortOrder ?? index + 1;
  return `public-site-testimonial-${order}`;
}

export function PublicSiteStudio() {
  const [draft, setDraft] = useState<PublicSiteContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    let active = true;

    publicSiteApi.getSiteContent()
      .then((response) => {
        if (!active) return;
        setDraft(normalizeContent(response));
        setMessage(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const text = error instanceof Error ? error.message : 'Unable to load public site content.';
        setMessage({ type: 'error', text });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateDraft = <K extends keyof PublicSiteContentResponse>(key: K, value: PublicSiteContentResponse[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateMedia = (sectionKey: string, patch: Partial<PublicSectionMedia>) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        mediaGallery: current.mediaGallery.map((item) => (
          item.sectionKey === sectionKey ? { ...item, ...patch } : item
        )),
      };
    });
  };

  const updateFeature = (index: number, patch: Partial<PublicSiteFeatureCard>) => {
    setDraft((current) => {
      if (!current) return current;
      const nextFeatures = [...current.featureCards];
      nextFeatures[index] = { ...nextFeatures[index], ...patch };
      return { ...current, featureCards: nextFeatures };
    });
  };

  const updateRoleBenefit = (index: number, patch: Partial<PublicRoleBenefit>) => {
    setDraft((current) => {
      if (!current) return current;
      const nextBenefits = [...current.roleBenefits];
      nextBenefits[index] = { ...nextBenefits[index], ...patch };
      return { ...current, roleBenefits: nextBenefits };
    });
  };

  const updateTestimonial = (index: number, patch: Partial<PublicTestimonial>) => {
    setDraft((current) => {
      if (!current) return current;
      const nextTestimonials = [...current.testimonials];
      nextTestimonials[index] = { ...nextTestimonials[index], ...patch };
      return { ...current, testimonials: nextTestimonials };
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await publicSiteApi.updateSiteContent({
        brandLabel: draft.brandLabel,
        heroEyebrow: draft.heroEyebrow,
        heroHeadline: draft.heroHeadline,
        heroSubheadline: draft.heroSubheadline,
        visionTitle: draft.visionTitle,
        visionBody: draft.visionBody,
        whyTitle: draft.whyTitle,
        whyBody: draft.whyBody,
        pricingHeadline: draft.pricingHeadline,
        pricingBody: draft.pricingBody,
        contactHeadline: draft.contactHeadline,
        contactBody: draft.contactBody,
        supportHeadline: draft.supportHeadline,
        supportBody: draft.supportBody,
        founderTitle: draft.founderTitle,
        founderName: draft.founderName,
        founderRole: draft.founderRole,
        founderMessageTitle: draft.founderMessageTitle,
        founderMessageBody: draft.founderMessageBody,
        founderSignoff: draft.founderSignoff,
        primaryCtaLabel: draft.primaryCtaLabel,
        primaryCtaUrl: draft.primaryCtaUrl,
        secondaryCtaLabel: draft.secondaryCtaLabel,
        secondaryCtaUrl: draft.secondaryCtaUrl,
        featureCards: draft.featureCards.map((item, index) => ({
          ...item,
          sortOrder: item.sortOrder ?? index + 1,
          bullets: item.bullets.filter(Boolean),
        })),
        roleBenefits: draft.roleBenefits.map((item) => ({
          ...item,
          outcomes: item.outcomes.filter(Boolean),
        })),
        mediaGallery: draft.mediaGallery,
        testimonials: draft.testimonials.map((item, index) => ({
          ...item,
          sortOrder: item.sortOrder ?? index + 1,
        })),
      });
      setDraft(normalizeContent(response));
      setMessage({ type: 'success', text: 'Public site content saved. New copy and media references are live.' });
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Unable to save public site content.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (assetKey: string, file: File, onComplete: (publicUrl: string) => void) => {
    setUploadingKey(assetKey);
    setMessage(null);
    try {
      const response = await publicSiteApi.uploadMedia(assetKey, file);
      onComplete(response.publicUrl);
      setMessage({ type: 'success', text: `Uploaded ${response.fileName} for ${assetKey}. Remember to save content after reviewing.` });
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Upload failed.';
      setMessage({ type: 'error', text });
    } finally {
      setUploadingKey(null);
    }
  };

  if (loading) {
    return (
      <section style={PANEL_STYLE}>
        <div className="flex items-center gap-3 text-slate-300">
          <Loader size={18} className="animate-spin" />
          Loading public site studio...
        </div>
      </section>
    );
  }

  if (!draft) {
    return (
      <section style={PANEL_STYLE}>
        <div className="flex items-center gap-3 text-rose-300">
          <AlertCircle size={18} />
          Public site content is unavailable right now.
        </div>
      </section>
    );
  }

  return (
    <section style={PANEL_STYLE}>
      <div className="flex items-start justify-between gap-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-300 mb-2">
            <Sparkles size={20} />
            <h3 className="text-lg font-bold text-white">Public Site Studio</h3>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Manage public storytelling copy, hero media, testimonials, founder visuals, and feature imagery from the platform admin UI.
            Image uploads are stored by the backend and exposed through public media URLs, so the site no longer depends on seed edits.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f472b6, rgba(255,255,255,0.72))',
            border: 'none',
            color: '#020617',
            fontWeight: 800,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          Save Public Site
        </button>
      </div>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : message.type === 'info'
              ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label>
            <span style={LABEL_STYLE}>Brand Label</span>
            <input value={draft.brandLabel} onChange={(e) => updateDraft('brandLabel', e.target.value)} style={INPUT_STYLE} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Hero Eyebrow</span>
            <input value={draft.heroEyebrow} onChange={(e) => updateDraft('heroEyebrow', e.target.value)} style={INPUT_STYLE} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Hero Headline</span>
            <textarea value={draft.heroHeadline} onChange={(e) => updateDraft('heroHeadline', e.target.value)} style={TEXTAREA_STYLE} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Hero Subheadline</span>
            <textarea value={draft.heroSubheadline} onChange={(e) => updateDraft('heroSubheadline', e.target.value)} style={TEXTAREA_STYLE} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Primary CTA</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={draft.primaryCtaLabel} onChange={(e) => updateDraft('primaryCtaLabel', e.target.value)} style={INPUT_STYLE} placeholder="Label" />
              <input value={draft.primaryCtaUrl} onChange={(e) => updateDraft('primaryCtaUrl', e.target.value)} style={INPUT_STYLE} placeholder="/onboarding" />
            </div>
          </label>
          <label>
            <span style={LABEL_STYLE}>Secondary CTA</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={draft.secondaryCtaLabel} onChange={(e) => updateDraft('secondaryCtaLabel', e.target.value)} style={INPUT_STYLE} placeholder="Label" />
              <input value={draft.secondaryCtaUrl} onChange={(e) => updateDraft('secondaryCtaUrl', e.target.value)} style={INPUT_STYLE} placeholder="/vision" />
            </div>
          </label>
        </div>

        <div className="space-y-4">
          <label>
            <span style={LABEL_STYLE}>Vision Section</span>
            <input value={draft.visionTitle} onChange={(e) => updateDraft('visionTitle', e.target.value)} style={INPUT_STYLE} placeholder="Section title" />
            <textarea value={draft.visionBody} onChange={(e) => updateDraft('visionBody', e.target.value)} style={{ ...TEXTAREA_STYLE, marginTop: 12 }} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Why Section</span>
            <input value={draft.whyTitle} onChange={(e) => updateDraft('whyTitle', e.target.value)} style={INPUT_STYLE} placeholder="Section title" />
            <textarea value={draft.whyBody} onChange={(e) => updateDraft('whyBody', e.target.value)} style={{ ...TEXTAREA_STYLE, marginTop: 12 }} />
          </label>
          <label>
            <span style={LABEL_STYLE}>Pricing Section</span>
            <input value={draft.pricingHeadline} onChange={(e) => updateDraft('pricingHeadline', e.target.value)} style={INPUT_STYLE} placeholder="Section title" />
            <textarea value={draft.pricingBody} onChange={(e) => updateDraft('pricingBody', e.target.value)} style={{ ...TEXTAREA_STYLE, marginTop: 12 }} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <label>
          <span style={LABEL_STYLE}>Contact Section</span>
          <input value={draft.contactHeadline} onChange={(e) => updateDraft('contactHeadline', e.target.value)} style={INPUT_STYLE} placeholder="Contact headline" />
          <textarea value={draft.contactBody} onChange={(e) => updateDraft('contactBody', e.target.value)} style={{ ...TEXTAREA_STYLE, marginTop: 12 }} />
        </label>
        <label>
          <span style={LABEL_STYLE}>Support Section</span>
          <input value={draft.supportHeadline} onChange={(e) => updateDraft('supportHeadline', e.target.value)} style={INPUT_STYLE} placeholder="Support headline" />
          <textarea value={draft.supportBody} onChange={(e) => updateDraft('supportBody', e.target.value)} style={{ ...TEXTAREA_STYLE, marginTop: 12 }} />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <label>
          <span style={LABEL_STYLE}>Founder Header</span>
          <input value={draft.founderTitle} onChange={(e) => updateDraft('founderTitle', e.target.value)} style={INPUT_STYLE} placeholder="Founder section label" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <input value={draft.founderName} onChange={(e) => updateDraft('founderName', e.target.value)} style={INPUT_STYLE} placeholder="Founder name" />
            <input value={draft.founderRole} onChange={(e) => updateDraft('founderRole', e.target.value)} style={INPUT_STYLE} placeholder="Founder role" />
          </div>
          <input value={draft.founderMessageTitle} onChange={(e) => updateDraft('founderMessageTitle', e.target.value)} style={{ ...INPUT_STYLE, marginTop: 12 }} placeholder="Founder message title" />
        </label>
        <label>
          <span style={LABEL_STYLE}>Founder Message</span>
          <textarea value={draft.founderMessageBody} onChange={(e) => updateDraft('founderMessageBody', e.target.value)} style={TEXTAREA_STYLE} />
          <input value={draft.founderSignoff} onChange={(e) => updateDraft('founderSignoff', e.target.value)} style={{ ...INPUT_STYLE, marginTop: 12 }} placeholder="Founder signoff" />
        </label>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white font-bold text-lg">Testimonials Thread</div>
            <div className="text-sm text-slate-400">Add social proof to the landing page and control who appears, in what order, and with which avatar.</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(52,211,153,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateDraft('testimonials', [...draft.testimonials, createEmptyTestimonial(draft.testimonials.length + 1)])}
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-bold text-emerald-100 shadow-lg shadow-emerald-500/10 backdrop-blur-sm transition-all"
          >
            Add Testimonial
          </motion.button>
        </div>
        <div className="space-y-4">
          {draft.testimonials.map((testimonial, index) => {
            const assetKey = fileKeyForTestimonial(index, testimonial);
            const isUploading = uploadingKey === assetKey;
            return (
              <div key={`${testimonial.sortOrder || index}-${testimonial.authorName || 'testimonial'}`} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-white font-semibold">Testimonial {index + 1}</div>
                  <button
                    onClick={() => updateDraft('testimonials', draft.testimonials.filter((_, currentIndex) => currentIndex !== index))}
                    className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-6">
                  <div className="relative group aspect-square rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
                    <img src={imagePreview(testimonial.avatarUrl)} alt={testimonial.authorName || `Testimonial ${index + 1}`} className="h-full w-full object-cover" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 scale-150">
                        {isUploading ? <Loader size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          handleUpload(assetKey, file, (publicUrl) => updateTestimonial(index, { avatarUrl: publicUrl }));
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label>
                      <span style={LABEL_STYLE}>Author Name</span>
                      <input value={testimonial.authorName} onChange={(e) => updateTestimonial(index, { authorName: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Author Role</span>
                      <input value={testimonial.authorRole} onChange={(e) => updateTestimonial(index, { authorRole: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Organization</span>
                      <input value={testimonial.organization} onChange={(e) => updateTestimonial(index, { organization: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Sort Order</span>
                      <input
                        type="number"
                        value={testimonial.sortOrder ?? index + 1}
                        onChange={(e) => updateTestimonial(index, { sortOrder: Number(e.target.value) || index + 1 })}
                        style={INPUT_STYLE}
                      />
                    </label>
                    <label className="md:col-span-2">
                      <span style={LABEL_STYLE}>Quote</span>
                      <textarea value={testimonial.quote} onChange={(e) => updateTestimonial(index, { quote: e.target.value })} style={{ ...TEXTAREA_STYLE, minHeight: 80 }} />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-white font-bold text-lg">Section Media</div>
          <div className="text-sm text-slate-400">Upload or replace the hero, story, and founder visuals without backend edits.</div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {draft.mediaGallery.map((media) => {
            const assetKey = `public-site-section-${media.sectionKey}`;
            const isUploading = uploadingKey === assetKey;
            return (
              <div key={media.sectionKey} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 flex flex-col gap-4">
                <div className="relative group aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
                  <img src={imagePreview(media.imageUrl)} alt={media.altText || media.sectionKey} className="h-full w-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 scale-150">
                      {isUploading ? <Loader size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        handleUpload(assetKey, file, (publicUrl) => updateMedia(media.sectionKey, { imageUrl: publicUrl }));
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="text-white font-semibold capitalize flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
                  {media.sectionKey} Lane
                </div>
                <label>
                  <span style={LABEL_STYLE}>Alt Text</span>
                  <input value={media.altText} onChange={(e) => updateMedia(media.sectionKey, { altText: e.target.value })} style={INPUT_STYLE} />
                </label>
                <label>
                  <span style={LABEL_STYLE}>Caption</span>
                  <input value={media.caption} onChange={(e) => updateMedia(media.sectionKey, { caption: e.target.value })} style={INPUT_STYLE} />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white font-bold text-lg">Feature Cards</div>
            <div className="text-sm text-slate-400">Edit every public feature lane, including card imagery and hover-story details.</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(56,189,248,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateDraft('featureCards', [...draft.featureCards, createEmptyFeatureCard(draft.featureCards.length + 1)])}
            className="rounded-xl border border-sky-400/40 bg-sky-500/20 px-5 py-2.5 text-sm font-bold text-sky-100 shadow-lg shadow-sky-500/10 backdrop-blur-sm transition-all"
          >
            Add Feature Card
          </motion.button>
        </div>
        <div className="space-y-4">
          {draft.featureCards.map((feature, index) => {
            const assetKey = fileKeyForFeature(index, feature);
            const isUploading = uploadingKey === assetKey;
            return (
              <div key={`${feature.sortOrder || index}-${feature.title}`} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-white font-semibold">Feature Card {index + 1}</div>
                  <button
                    onClick={() => updateDraft('featureCards', draft.featureCards.filter((_, currentIndex) => currentIndex !== index))}
                    className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-6">
                  <div className="relative group aspect-[4/3] rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
                    <img src={imagePreview(feature.imageUrl)} alt={feature.title || `Feature ${index + 1}`} className="h-full w-full object-cover" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 scale-150">
                        {isUploading ? <Loader size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          handleUpload(assetKey, file, (publicUrl) => updateFeature(index, { imageUrl: publicUrl }));
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label>
                      <span style={LABEL_STYLE}>Title</span>
                      <input value={feature.title} onChange={(e) => updateFeature(index, { title: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Category</span>
                      <input value={feature.category} onChange={(e) => updateFeature(index, { category: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Accent Color</span>
                      <input value={feature.accentColor} onChange={(e) => updateFeature(index, { accentColor: e.target.value })} style={INPUT_STYLE} />
                    </label>
                    <label>
                      <span style={LABEL_STYLE}>Sort Order</span>
                      <input
                        type="number"
                        value={feature.sortOrder ?? index + 1}
                        onChange={(e) => updateFeature(index, { sortOrder: Number(e.target.value) || index + 1 })}
                        style={INPUT_STYLE}
                      />
                    </label>
                    <label className="md:col-span-2">
                      <span style={LABEL_STYLE}>Description</span>
                      <textarea value={feature.description} onChange={(e) => updateFeature(index, { description: e.target.value })} style={{ ...TEXTAREA_STYLE, minHeight: 60 }} />
                    </label>
                    <label className="md:col-span-2">
                      <span style={LABEL_STYLE}>Bullet Points (one per line)</span>
                      <textarea
                        value={feature.bullets.join('\n')}
                        onChange={(e) => updateFeature(index, { bullets: e.target.value.split('\n') })}
                        style={{ ...TEXTAREA_STYLE, minHeight: 80 }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white font-bold text-lg">Role Benefits</div>
            <div className="text-sm text-slate-400">Keep the public explanation of each user role editable from the admin surface.</div>
          </div>
          <button
            onClick={() => updateDraft('roleBenefits', [...draft.roleBenefits, createEmptyRoleBenefit()])}
            className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200"
          >
            Add Role Benefit
          </button>
        </div>
        <div className="space-y-4">
          {draft.roleBenefits.map((benefit, index) => (
            <div key={`${benefit.roleKey || 'role'}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-white font-semibold">Role Benefit {index + 1}</div>
                <button
                  onClick={() => updateDraft('roleBenefits', draft.roleBenefits.filter((_, currentIndex) => currentIndex !== index))}
                  className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  <span style={LABEL_STYLE}>Role Key</span>
                  <input value={benefit.roleKey} onChange={(e) => updateRoleBenefit(index, { roleKey: e.target.value })} style={INPUT_STYLE} />
                </label>
                <label>
                  <span style={LABEL_STYLE}>Role Label</span>
                  <input value={benefit.roleLabel} onChange={(e) => updateRoleBenefit(index, { roleLabel: e.target.value })} style={INPUT_STYLE} />
                </label>
                <label>
                  <span style={LABEL_STYLE}>Headline</span>
                  <input value={benefit.headline} onChange={(e) => updateRoleBenefit(index, { headline: e.target.value })} style={INPUT_STYLE} />
                </label>
                <label>
                  <span style={LABEL_STYLE}>Accent Color</span>
                  <input value={benefit.accentColor} onChange={(e) => updateRoleBenefit(index, { accentColor: e.target.value })} style={INPUT_STYLE} />
                </label>
                <label className="md:col-span-2">
                  <span style={LABEL_STYLE}>Description</span>
                  <textarea value={benefit.description} onChange={(e) => updateRoleBenefit(index, { description: e.target.value })} style={{ ...TEXTAREA_STYLE, minHeight: 110 }} />
                </label>
                <label className="md:col-span-2">
                  <span style={LABEL_STYLE}>Outcomes (one per line)</span>
                  <textarea
                    value={benefit.outcomes.join('\n')}
                    onChange={(e) => updateRoleBenefit(index, { outcomes: e.target.value.split('\n') })}
                    style={{ ...TEXTAREA_STYLE, minHeight: 110 }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
