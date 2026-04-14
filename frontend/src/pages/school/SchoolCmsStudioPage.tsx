import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Globe2, Image as ImageIcon, Layers3, Loader, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { useStore } from '../../store/useStore';
import {
  schoolCmsApi,
  type CmsDashboardStats,
  type SchoolAcademicContent,
  type SchoolAchievement,
  type SchoolAdmissionInfo,
  type SchoolAffiliationInfo,
  type SchoolBranch,
  type SchoolEnquiry,
  type SchoolGalleryAlbum,
  type SchoolInfrastructureItem,
  type SchoolLandingProfile,
  type SchoolSectionConfig,
  type SchoolSocialLink,
  type SchoolTestimonial,
} from '../../lib/schoolPortalApi';

type CmsTab = 'overview' | 'profile' | 'content' | 'media' | 'operations' | 'sections';

const TABS: { id: CmsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'content', label: 'Admissions & academics' },
  { id: 'media', label: 'Media & proof' },
  { id: 'operations', label: 'Branches & inbox' },
  { id: 'sections', label: 'Visibility' },
];

export default function SchoolCmsStudioPage() {
  const { session } = useStore();
  const [tab, setTab] = useState<CmsTab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<CmsDashboardStats | null>(null);
  const [profile, setProfile] = useState<SchoolLandingProfile>({ id: '', tenantId: '', schoolName: '' });
  const [admissionInfo, setAdmissionInfo] = useState<SchoolAdmissionInfo>({ id: '', overview: '', process: '', eligibility: '' });
  const [academicContent, setAcademicContent] = useState<SchoolAcademicContent>({ id: '', curriculum: '', coCurricular: '', scholarshipInfo: '', resultHighlights: '', notices: '', calendarData: '' });
  const [affiliation, setAffiliation] = useState<SchoolAffiliationInfo>({ boardName: '', affiliationNumber: '', complianceText: '', recognitionDetails: '' });
  const [branches, setBranches] = useState<SchoolBranch[]>([]);
  const [enquiries, setEnquiries] = useState<SchoolEnquiry[]>([]);
  const [albums, setAlbums] = useState<SchoolGalleryAlbum[]>([]);
  const [testimonials, setTestimonials] = useState<SchoolTestimonial[]>([]);
  const [achievements, setAchievements] = useState<SchoolAchievement[]>([]);
  const [infrastructure, setInfrastructure] = useState<SchoolInfrastructureItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SchoolSocialLink[]>([]);
  const [sectionConfigs, setSectionConfigs] = useState<SchoolSectionConfig[]>([]);
  const [branchDraft, setBranchDraft] = useState({ branchName: '', address: '', city: '', state: '', phone: '', email: '' });
  const [socialDraft, setSocialDraft] = useState({ platform: 'Facebook', url: '' });
  const [albumDraft, setAlbumDraft] = useState({ title: '', description: '' });
  const [testimonialDraft, setTestimonialDraft] = useState({ authorName: '', relationshipType: '', designation: '', content: '', rating: 5 });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      schoolCmsApi.getDashboardStats(),
      schoolCmsApi.getProfile(),
      schoolCmsApi.getAdmissionInfo(),
      schoolCmsApi.getAcademicContent(),
      schoolCmsApi.getAffiliation(),
      schoolCmsApi.listBranches(),
      schoolCmsApi.getEnquiries(),
      schoolCmsApi.listAlbums(),
      schoolCmsApi.listTestimonials(),
      schoolCmsApi.listAchievements(),
      schoolCmsApi.listInfrastructure(),
      schoolCmsApi.listSocialLinks(),
      schoolCmsApi.listSectionConfigs(),
    ]).then((results) => {
      if (!active) return;
      const [a, b, c, d, e, f, g, h, i, j, k, l, m] = results;
      if (a.status === 'fulfilled') setStats(a.value);
      if (b.status === 'fulfilled') setProfile(b.value);
      if (c.status === 'fulfilled') setAdmissionInfo(c.value);
      if (d.status === 'fulfilled') setAcademicContent(d.value);
      if (e.status === 'fulfilled') setAffiliation(e.value);
      if (f.status === 'fulfilled') setBranches(f.value);
      if (g.status === 'fulfilled') setEnquiries(g.value);
      if (h.status === 'fulfilled') setAlbums(h.value);
      if (i.status === 'fulfilled') setTestimonials(i.value);
      if (j.status === 'fulfilled') setAchievements(j.value);
      if (k.status === 'fulfilled') setInfrastructure(k.value);
      if (l.status === 'fulfilled') setSocialLinks(l.value);
      if (m.status === 'fulfilled') setSectionConfigs(m.value);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    const host = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')
      ? `${session.schoolCode?.toLowerCase() || 'demo-school'}.localhost${window.location.port ? `:${window.location.port}` : ''}`
      : `${session.schoolCode?.toLowerCase() || 'demo-school'}.${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
    return `${window.location.protocol}//${host}`;
  }, [session.schoolCode]);

  const completionItems = useMemo(() => {
    const c = stats?.completeness;
    if (!c) return [];
    return [
      ['Profile', c.hasProfile],
      ['Gallery', c.hasGallery],
      ['Testimonials', c.hasTestimonials],
      ['Achievements', c.hasAchievements],
      ['Admission info', c.hasAdmissionInfo],
      ['Fee structure', c.hasFeeStructure],
    ];
  }, [stats]);

  const save = async (key: string, action: () => Promise<void>) => {
    setSaving(key);
    setMessage('');
    try {
      await action();
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save CMS changes.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading school CMS studio" description="Preparing profile, media, sections, and enquiry data." accent="#ffb663" />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="School landing CMS"
        title="Manage the public school experience"
        description="This studio expands the earlier CMS foundation into profile, content, media, operations, and section visibility controls using the existing CMS APIs."
        actions={<Button onClick={() => window.open(previewUrl, '_blank')}>Preview public site</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="glass-panel" style={{ padding: 16, display: 'grid', gap: 10, alignSelf: 'start' }}>
          {TABS.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? 'primary-button' : 'secondary-button'} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {tab === 'overview' ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <PortalStatCard label="Completion" value={`${stats?.completeness?.completionPercent || 0}%`} icon={Sparkles} accent="#ffb663" />
                <PortalStatCard label="Pending enquiries" value={stats?.pendingEnquiries || 0} icon={Mail} accent="#fb7185" />
                <PortalStatCard label="Upcoming events" value={stats?.upcomingEvents || 0} icon={CalendarDays} accent="#22d3ee" />
                <PortalStatCard label="Media blocks" value={albums.length + testimonials.length + achievements.length} icon={ImageIcon} accent="#a78bfa" />
              </div>
              <PortalSection title="Launch readiness" description="The public landing page should only go live once these core modules are ready.">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {completionItems.map(([label, complete]) => (
                    <div key={label} className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{label}</span>
                      <span style={{ color: complete ? '#34d399' : '#fbbf24', fontWeight: 800 }}>{complete ? 'Ready' : 'Needs work'}</span>
                    </div>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}
          {tab === 'profile' ? (
            <PortalSection title="Profile" description="Hero, about, mission, contact, and founder-facing content.">
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ['School name', 'schoolName'],
                  ['Short name', 'shortName'],
                  ['Tagline', 'tagline'],
                  ['Phone', 'phone'],
                  ['Email', 'email'],
                  ['Website', 'website'],
                  ['City', 'city'],
                  ['State', 'state'],
                ].map(([label, key]) => (
                  <label key={key} className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                    <input className="input-field" value={(profile as Record<string, any>)[key] || ''} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} />
                  </label>
                ))}
                {[
                  ['Short description', 'shortDescription', 3],
                  ['About', 'aboutHtml', 5],
                  ['Objective', 'objective', 4],
                  ['Mission', 'mission', 4],
                  ['Vision', 'vision', 4],
                  ['History', 'history', 4],
                  ['Why choose us', 'whyUs', 4],
                ].map(([label, key, rows]) => (
                  <label key={key} className="grid gap-2 xl:col-span-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                    <textarea className="input-field" rows={rows as number} value={(profile as Record<string, any>)[key] || ''} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => save('publish-profile', async () => {
                  const next = await schoolCmsApi.publishProfile(!(profile.isPublished ?? false));
                  setProfile(next);
                  setMessage(next.isPublished ? 'Profile published.' : 'Profile unpublished.');
                })} isLoading={saving === 'publish-profile'}>
                  {profile.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button onClick={() => save('profile', async () => {
                  const next = await schoolCmsApi.saveProfile(profile);
                  setProfile(next);
                  setMessage('Profile updated.');
                })} isLoading={saving === 'profile'}>
                  Save profile
                </Button>
              </div>
            </PortalSection>
          ) : null}

          {tab === 'content' ? (
            <>
              <PortalSection title="Admissions" description="Public admission overview, process, eligibility, and contact blocks.">
                <div className="grid gap-4">
                  {[
                    ['Overview', 'overview', 4],
                    ['Eligibility', 'eligibility', 4],
                    ['Process', 'process', 4],
                  ].map(([label, key, rows]) => (
                    <label key={key} className="grid gap-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                      <textarea className="input-field" rows={rows as number} value={(admissionInfo as Record<string, any>)[key] || ''} onChange={(event) => setAdmissionInfo((current) => ({ ...current, [key]: event.target.value }))} />
                    </label>
                  ))}
                </div>
                <Button onClick={() => save('admissions', async () => {
                  const next = await schoolCmsApi.saveAdmissionInfo(admissionInfo);
                  setAdmissionInfo(next);
                  setMessage('Admission content updated.');
                })} isLoading={saving === 'admissions'}>
                  Save admissions
                </Button>
              </PortalSection>

              <PortalSection title="Academics and affiliation" description="Curriculum, co-curriculars, notices, results, and compliance text.">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="grid gap-4">
                    {[
                      ['Curriculum', 'curriculum', 4],
                      ['Co-curricular', 'coCurricular', 4],
                      ['Scholarship / awards', 'scholarshipInfo', 3],
                      ['Result highlights', 'resultHighlights', 3],
                      ['Notices', 'notices', 3],
                      ['Academic calendar', 'calendarData', 3],
                    ].map(([label, key, rows]) => (
                      <label key={key} className="grid gap-2">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                        <textarea className="input-field" rows={rows as number} value={(academicContent as Record<string, any>)[key] || ''} onChange={(event) => setAcademicContent((current) => ({ ...current, [key]: event.target.value }))} />
                      </label>
                    ))}
                    <Button onClick={() => save('academics', async () => {
                      const next = await schoolCmsApi.saveAcademicContent(academicContent);
                      setAcademicContent(next);
                      setMessage('Academic content updated.');
                    })} isLoading={saving === 'academics'}>
                      Save academics
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {[
                      ['Board name', 'boardName'],
                      ['Affiliation number', 'affiliationNumber'],
                    ].map(([label, key]) => (
                      <label key={key} className="grid gap-2">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                        <input className="input-field" value={(affiliation as Record<string, any>)[key] || ''} onChange={(event) => setAffiliation((current) => ({ ...current, [key]: event.target.value }))} />
                      </label>
                    ))}
                    {[
                      ['Compliance text', 'complianceText', 4],
                      ['Recognition details', 'recognitionDetails', 4],
                    ].map(([label, key, rows]) => (
                      <label key={key} className="grid gap-2">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                        <textarea className="input-field" rows={rows as number} value={(affiliation as Record<string, any>)[key] || ''} onChange={(event) => setAffiliation((current) => ({ ...current, [key]: event.target.value }))} />
                      </label>
                    ))}
                    <Button onClick={() => save('affiliation', async () => {
                      const next = await schoolCmsApi.saveAffiliation(affiliation);
                      setAffiliation(next);
                      setMessage('Affiliation content updated.');
                    })} isLoading={saving === 'affiliation'}>
                      Save affiliation
                    </Button>
                  </div>
                </div>
              </PortalSection>
            </>
          ) : null}

          {tab === 'media' ? (
            <PortalSection title="Media and social proof" description="Albums, testimonials, achievements, and infrastructure highlights.">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="grid gap-4">
                  <input className="input-field" placeholder="Album title" value={albumDraft.title} onChange={(event) => setAlbumDraft((current) => ({ ...current, title: event.target.value }))} />
                  <textarea className="input-field" rows={3} placeholder="Album description" value={albumDraft.description} onChange={(event) => setAlbumDraft((current) => ({ ...current, description: event.target.value }))} />
                  <Button onClick={() => save('album', async () => {
                    const next = await schoolCmsApi.createAlbum({ ...albumDraft, isPublished: true });
                    setAlbums((current) => [next, ...current]);
                    setAlbumDraft({ title: '', description: '' });
                    setMessage('Album created.');
                  })} isLoading={saving === 'album'}>
                    Add album
                  </Button>
                  <input className="input-field" placeholder="Testimonial author" value={testimonialDraft.authorName} onChange={(event) => setTestimonialDraft((current) => ({ ...current, authorName: event.target.value }))} />
                  <textarea className="input-field" rows={4} placeholder="Testimonial content" value={testimonialDraft.content} onChange={(event) => setTestimonialDraft((current) => ({ ...current, content: event.target.value }))} />
                  <Button onClick={() => save('testimonial', async () => {
                    const next = await schoolCmsApi.createTestimonial({ ...testimonialDraft, isPublished: true, displayOrder: testimonials.length + 1 });
                    setTestimonials((current) => [next, ...current]);
                    setTestimonialDraft({ authorName: '', relationshipType: '', designation: '', content: '', rating: 5 });
                    setMessage('Testimonial created.');
                  })} isLoading={saving === 'testimonial'}>
                    Add testimonial
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <PortalStatCard label="Albums" value={albums.length} icon={ImageIcon} accent="#22d3ee" />
                  <PortalStatCard label="Testimonials" value={testimonials.length} icon={Users} accent="#ffb663" />
                  <PortalStatCard label="Achievements" value={achievements.length} icon={ShieldCheck} accent="#34d399" />
                  <PortalStatCard label="Infrastructure" value={infrastructure.length} icon={Layers3} accent="#a78bfa" />
                </div>
              </div>
            </PortalSection>
          ) : null}

          {tab === 'operations' ? (
            <PortalSection title="Branches and social links" description="Branch cards, footer links, and public contact routing.">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="grid gap-4">
                  {['branchName', 'address', 'city', 'state', 'phone', 'email'].map((key) => (
                    <input key={key} className="input-field" placeholder={key} value={(branchDraft as Record<string, string>)[key]} onChange={(event) => setBranchDraft((current) => ({ ...current, [key]: event.target.value }))} />
                  ))}
                  <Button onClick={() => save('branch', async () => {
                    const next = await schoolCmsApi.createBranch({ ...branchDraft, isPublished: true, isPrimary: branches.length === 0 });
                    setBranches((current) => [next, ...current]);
                    setBranchDraft({ branchName: '', address: '', city: '', state: '', phone: '', email: '' });
                    setMessage('Branch created.');
                  })} isLoading={saving === 'branch'}>
                    Add branch
                  </Button>
                </div>
                <div className="grid gap-4">
                  <input className="input-field" placeholder="Platform" value={socialDraft.platform} onChange={(event) => setSocialDraft((current) => ({ ...current, platform: event.target.value }))} />
                  <input className="input-field" placeholder="URL" value={socialDraft.url} onChange={(event) => setSocialDraft((current) => ({ ...current, url: event.target.value }))} />
                  <Button onClick={() => save('social', async () => {
                    const next = await schoolCmsApi.createSocialLink({ ...socialDraft, isPublished: true, displayOrder: socialLinks.length + 1 });
                    setSocialLinks((current) => [next, ...current]);
                    setSocialDraft({ platform: 'Facebook', url: '' });
                    setMessage('Social link created.');
                  })} isLoading={saving === 'social'}>
                    Add social link
                  </Button>
                  <div className="glass-panel" style={{ padding: 16, color: 'var(--text-dim)' }}>
                    {enquiries.length} enquiry records available for follow-up.
                  </div>
                </div>
              </div>
            </PortalSection>
          ) : null}

          {tab === 'sections' ? (
            <PortalSection title="Section visibility" description="Control section order and visibility without breaking the shared landing-page rhythm.">
              <div className="grid gap-3">
                {sectionConfigs.length === 0 ? (
                  <div className="glass-panel" style={{ padding: 18, color: 'var(--text-dim)' }}>No section configs returned yet.</div>
                ) : sectionConfigs.map((section) => (
                  <div key={section.sectionKey} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{section.titleOverride || section.sectionKey}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>Order {section.displayOrder ?? 0}</div>
                      </div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-strong)', fontWeight: 700 }}>
                        <input type="checkbox" checked={Boolean(section.isEnabled)} onChange={(event) => setSectionConfigs((current) => current.map((entry) => entry.sectionKey === section.sectionKey ? { ...entry, isEnabled: event.target.checked } : entry))} />
                        Visible
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                      <input className="input-field" type="number" value={section.displayOrder ?? 0} onChange={(event) => setSectionConfigs((current) => current.map((entry) => entry.sectionKey === section.sectionKey ? { ...entry, displayOrder: Number(event.target.value) } : entry))} />
                      <input className="input-field" value={section.titleOverride || ''} placeholder="Optional title override" onChange={(event) => setSectionConfigs((current) => current.map((entry) => entry.sectionKey === section.sectionKey ? { ...entry, titleOverride: event.target.value } : entry))} />
                    </div>
                    <Button onClick={() => save(`section-${section.sectionKey}`, async () => {
                      const next = await schoolCmsApi.saveSectionConfig({
                        sectionKey: section.sectionKey,
                        isEnabled: Boolean(section.isEnabled),
                        displayOrder: section.displayOrder ?? 0,
                        titleOverride: section.titleOverride || '',
                        subtitleOverride: section.subtitleOverride || '',
                        configJson: section.configJson || '',
                      });
                      setSectionConfigs((current) => current.map((entry) => entry.sectionKey === section.sectionKey ? next : entry));
                      setMessage(`Section ${section.sectionKey} updated.`);
                    })} isLoading={saving === `section-${section.sectionKey}`}>
                      Save section
                    </Button>
                  </div>
                ))}
              </div>
            </PortalSection>
          ) : null}

          {message ? <div className="glass-panel" style={{ padding: 16, color: 'var(--text-dim)' }}>{message}</div> : null}
        </div>
      </div>
    </div>
  );
}
