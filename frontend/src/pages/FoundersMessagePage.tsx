import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Quote, Sparkles } from 'lucide-react';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { FallbackImage } from '../components/ui/FallbackImage';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';

export default function FoundersMessagePage() {
  const { content } = usePublicSiteContent();
  const founderMedia = content?.mediaGallery.find((item) => item.sectionKey === 'founder');

  return (
    <PublicSiteFrame content={content} activePath="/vision" mode="ambient" density={1.05}>
      <section className="public-page-intro public-page-intro--focus">
        <PublicPretextHeading
          eyebrow="Vision"
          pretext="North Star"
          title={content?.founderMessageTitle || 'A letter from the product team'}
          description={content?.founderRole || 'Platform builders for institutions that want continuity, operational depth, and fewer disconnected systems.'}
          align="center"
        />
      </section>

      <section className="public-site-founder-page">
        <HoverTiltCard className="public-site-founder-page__visual public-panel--strong" accentColor="#ffb663" as="article" maxTilt={12}>
          <FallbackImage
            src={founderMedia?.imageUrl || '/school_facade.png'}
            fallbackSrc={founderMedia?.fallbackImageUrl || '/hero.png'}
            alt={founderMedia?.altText || 'Founder visual'}
            className="public-site-founder-page__image"
          />
          <div className="public-site-founder-page__caption">{founderMedia?.caption || 'We are building for institutions that need operational depth.'}</div>
        </HoverTiltCard>

        <HoverTiltCard className="public-site-founder-page__letter public-panel" accentColor="#22d3ee" as="article" maxTilt={10}>
          <div className="public-status-chip"><Compass size={14} /> Product direction</div>
          <div className="public-site-founder-page__quote"><Quote size={20} /></div>
          <h2>{content?.founderTitle || 'Vision'}</h2>
          <p>{content?.founderMessageBody || 'The founder story is loading.'}</p>
          <div className="public-site-founder-page__signoff">
            <strong>{content?.founderName || 'ElevateSmart Product Team'}</strong>
            <span>{content?.founderSignoff || 'Built for schools that want operational depth.'}</span>
          </div>
          <div className="public-site-founder-page__actions">
            <Link to="/contact" className="public-primary-button">
              Talk to us
              <ArrowRight size={16} />
            </Link>
            <Link to="/support" className="public-secondary-button">Raise support</Link>
          </div>
        </HoverTiltCard>
      </section>

      <section className="public-site-section">
        <div className="public-launch-grid">
          <HoverTiltCard className="public-launch-card public-panel" accentColor="#a78bfa" as="article" maxTilt={12}>
            <div className="public-status-chip"><Sparkles size={14} /> Intent</div>
            <h3>Why this platform exists</h3>
            <p>We are building for institutions that need operational depth, fewer disconnected tools, and better follow-through across every role.</p>
          </HoverTiltCard>
          <HoverTiltCard className="public-launch-card public-panel--strong" accentColor="#22d3ee" as="article" maxTilt={12}>
            <div className="public-status-chip"><Compass size={14} /> Next move</div>
            <h3>See whether the platform fits your path</h3>
            <p>If the vision matches your reality, the next step is a conversation about rollout, capacity, and how quickly you want to move.</p>
            <Link to="/pricing" className="public-secondary-button public-launch-card__button">Review pricing</Link>
          </HoverTiltCard>
        </div>
      </section>
    </PublicSiteFrame>
  );
}
