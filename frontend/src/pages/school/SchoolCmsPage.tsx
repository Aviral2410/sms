import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, Globe2, Loader, Mail, MapPin, Sparkles, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import {
  schoolCmsApi,
  type CmsDashboardStats,
  type SchoolAcademicContent,
  type SchoolAcademicContentRequest,
  type SchoolAdmissionInfo,
  type SchoolAdmissionInfoRequest,
  type SchoolBranch,
  type SchoolEnquiry,
  type SchoolEvent,
  type SchoolFeeStructure,
  type SchoolLandingProfile,
  type SchoolLandingProfileRequest,
  type SchoolLeader,
} from '../../lib/schoolPortalApi';

type CmsTab = 'overview' | 'profile' | 'content' | 'leadership' | 'events' | 'operations';

const TABS: { id: CmsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'content', label: 'Admissions & Academics' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'events', label: 'Events' },
  { id: 'operations', label: 'Branches, Fees & Inbox' },
];

export default function SchoolCmsPage() {
  const [tab, setTab] = useState<CmsTab>('overview');
  const [stats, setStats] = useState<CmsDashboardStats | null>(null);
  const [profile, setProfile] = useState<SchoolLandingProfile | null>(null);
  const [admissionInfo, setAdmissionInfo] = useState<SchoolAdmissionInfo | null>(null);
  const [academicContent, setAcademicContent] = useState<SchoolAcademicContent | null>(null);
  const [leaders, setLeaders] = useState<SchoolLeader[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [branches, setBranches] = useState<SchoolBranch[]>([]);
  const [feeStructures, setFeeStructures] = useState<SchoolFeeStructure[]>([]);
  const [enquiries, setEnquiries] = useState<SchoolEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const [leaderDraft, setLeaderDraft] = useState({ type: 'FOUNDER', name: '', title: '', bio: '', message: '' });
  const [eventDraft, setEventDraft] = useState({ title: '', description: '', startAt: '', location: '', registrationUrl: '' });
  const [branchDraft, setBranchDraft] = useState({ branchName: '', address: '', city: '', state: '', phone: '', email: '' });
  const [feeDraft, setFeeDraft] = useState({ academicYear: '', title: '', description: '', structuredDataJson: '' });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      schoolCmsApi.getDashboardStats(),
      schoolCmsApi.getProfile(),
      schoolCmsApi.getAdmissionInfo(),
      schoolCmsApi.getAcademicContent(),
      schoolCmsApi.listLeaders(),
      schoolCmsApi.listEvents(),
      schoolCmsApi.listBranches(),
      schoolCmsApi.listFeeStructures(),
      schoolCmsApi.getEnquiries(),
    ])
      .then((results) => {
        if (!active) return;
        const [statsResult, profileResult, admissionResult, academicsResult, leadersResult, eventsResult, branchesResult, feesResult, enquiriesResult] = results;
        if (statsResult.status === 'fulfilled') setStats(statsResult.value);
        if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
        if (admissionResult.status === 'fulfilled') setAdmissionInfo(admissionResult.value);
        if (academicsResult.status === 'fulfilled') setAcademicContent(academicsResult.value);
        if (leadersResult.status === 'fulfilled') setLeaders(leadersResult.value);
        if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
        if (branchesResult.status === 'fulfilled') setBranches(branchesResult.value);
        if (feesResult.status === 'fulfilled') setFeeStructures(feesResult.value);
        if (enquiriesResult.status === 'fulfilled') setEnquiries(enquiriesResult.value);
      })
      .catch(() => {
        if (active) setMessage('Unable to load school CMS data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completionItems = useMemo<Array<[string, boolean]>>(() => {
    const completion = stats?.completeness;
    if (!completion) return [];
    const items: Array<[string, boolean]> = [
      ['Profile', !!completion.hasProfile],
      ['Leaders', !!completion.hasLeaders],
      ['Branches', !!completion.hasBranches],
      ['Events', !!completion.hasEvents],
      ['Gallery', !!completion.hasGallery],
      ['Testimonials', !!completion.hasTestimonials],
      ['Achievements', !!completion.hasAchievements],
      ['Admission info', !!completion.hasAdmissionInfo],
      ['Fee structure', !!completion.hasFeeStructure],
    ];
    return items;
  }, [stats?.completeness]);

  const toProfileRequest = (value: SchoolLandingProfile): SchoolLandingProfileRequest => ({
    schoolName: value.schoolName,
    shortName: value.shortName ?? undefined,
    tagline: value.tagline ?? undefined,
    shortDescription: value.shortDescription ?? undefined,
    aboutHtml: value.aboutHtml ?? undefined,
    objective: value.objective ?? undefined,
    mission: value.mission ?? undefined,
    vision: value.vision ?? undefined,
    history: value.history ?? undefined,
    whyUs: value.whyUs ?? undefined,
    addressLine1: value.addressLine1 ?? undefined,
    addressLine2: value.addressLine2 ?? undefined,
    city: value.city ?? undefined,
    state: value.state ?? undefined,
    country: value.country ?? undefined,
    pincode: value.pincode ?? undefined,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    phone: value.phone ?? undefined,
    alternatePhone: value.alternatePhone ?? undefined,
    email: value.email ?? undefined,
    website: value.website ?? undefined,
    officeHours: value.officeHours ?? undefined,
    isPublished: value.isPublished ?? undefined,
  });

  const toAdmissionRequest = (value: SchoolAdmissionInfo): SchoolAdmissionInfoRequest => ({
    overview: value.overview ?? undefined,
    process: value.process ?? undefined,
    eligibility: value.eligibility ?? undefined,
    brochureMediaId: value.brochureMediaId ?? null,
    contactName: value.contactName ?? undefined,
    contactPhone: value.contactPhone ?? undefined,
    contactEmail: value.contactEmail ?? undefined,
    isPublished: value.isPublished ?? undefined,
  });

  const toAcademicContentRequest = (value: SchoolAcademicContent): SchoolAcademicContentRequest => ({
    curriculum: value.curriculum ?? undefined,
    coCurricular: value.coCurricular ?? undefined,
    scholarshipInfo: value.scholarshipInfo ?? undefined,
    resultHighlights: value.resultHighlights ?? undefined,
    notices: value.notices ?? undefined,
    calendarData: value.calendarData ?? undefined,
    isPublished: value.isPublished ?? undefined,
  });

  const saveProfile = async () => {
    if (!profile) return;
    setSaving('profile');
    setMessage('');
    try {
      const response = await schoolCmsApi.saveProfile(toProfileRequest(profile));
      setProfile(response);
      setMessage('Profile updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save profile.');
    } finally {
      setSaving(null);
    }
  };

  const toggleProfilePublish = async (publish: boolean) => {
    setSaving('publish');
    setMessage('');
    try {
      const response = await schoolCmsApi.publishProfile(publish);
      setProfile(response);
      setMessage(publish ? 'Profile published.' : 'Profile unpublished.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update publish state.');
    } finally {
      setSaving(null);
    }
  };

  const saveAdmission = async () => {
    if (!admissionInfo) return;
    setSaving('admission');
    setMessage('');
    try {
      const response = await schoolCmsApi.saveAdmissionInfo(toAdmissionRequest(admissionInfo));
      setAdmissionInfo(response);
      setMessage('Admission content updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save admission content.');
    } finally {
      setSaving(null);
    }
  };

  const saveAcademics = async () => {
    if (!academicContent) return;
    setSaving('academics');
    setMessage('');
    try {
      const response = await schoolCmsApi.saveAcademicContent(toAcademicContentRequest(academicContent));
      setAcademicContent(response);
      setMessage('Academic content updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save academic content.');
    } finally {
      setSaving(null);
    }
  };

  const createLeader = async () => {
    if (!leaderDraft.name.trim()) {
      setMessage('Leader name is required.');
      return;
    }
    setSaving('leader');
    setMessage('');
    try {
      const response = await schoolCmsApi.createLeader({ ...leaderDraft, isPublished: true });
      setLeaders((current) => [response, ...current]);
      setLeaderDraft({ type: 'FOUNDER', name: '', title: '', bio: '', message: '' });
      setMessage('Leader created.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create leader.');
    } finally {
      setSaving(null);
    }
  };

  const createEvent = async () => {
    if (!eventDraft.title.trim()) {
      setMessage('Event title is required.');
      return;
    }
    setSaving('event');
    setMessage('');
    try {
      const response = await schoolCmsApi.createEvent({ ...eventDraft, isPublished: true, isFeatured: events.length === 0 });
      setEvents((current) => [response, ...current]);
      setEventDraft({ title: '', description: '', startAt: '', location: '', registrationUrl: '' });
      setMessage('Event created.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create event.');
    } finally {
      setSaving(null);
    }
  };

  const createBranch = async () => {
    if (!branchDraft.branchName.trim()) {
      setMessage('Branch name is required.');
      return;
    }
    setSaving('branch');
    setMessage('');
    try {
      const response = await schoolCmsApi.createBranch({ ...branchDraft, isPublished: true, isPrimary: branches.length === 0 });
      setBranches((current) => [response, ...current]);
      setBranchDraft({ branchName: '', address: '', city: '', state: '', phone: '', email: '' });
      setMessage('Branch created.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create branch.');
    } finally {
      setSaving(null);
    }
  };

  const createFeeStructure = async () => {
    if (!feeDraft.academicYear.trim() || !feeDraft.title.trim()) {
      setMessage('Academic year and title are required.');
      return;
    }
    setSaving('fees');
    setMessage('');
    try {
      const response = await schoolCmsApi.createFeeStructure({ ...feeDraft, isPublished: true });
      setFeeStructures((current) => [response, ...current]);
      setFeeDraft({ academicYear: '', title: '', description: '', structuredDataJson: '' });
      setMessage('Fee structure created.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create fee structure.');
    } finally {
      setSaving(null);
    }
  };

  const markEnquiry = async (id: string, status: string) => {
    setSaving(id);
    setMessage('');
    try {
      await schoolCmsApi.updateEnquiryStatus(id, status);
      setEnquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      setMessage(`Enquiry moved to ${status}.`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update enquiry status.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading school CMS" description="Fetching school profile, public-site content, and enquiries." accent="#ffb663" />;
  }

  if (!profile || !admissionInfo || !academicContent) {
    return <PortalStatePanel title="CMS unavailable" description={message || 'The school CMS could not be initialized.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="School landing CMS"
        title="Manage public school experience"
        description="Edit the school profile, admissions, public content, and supporting modules from the same dashboard shell used across the platform."
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
                <PortalStatCard label="Upcoming events" value={stats?.upcomingEvents || 0} icon={CalendarDays} accent="#22d3ee" />
                <PortalStatCard label="Pending enquiries" value={stats?.pendingEnquiries || 0} icon={Mail} accent="#fb7185" />
                <PortalStatCard label="Gallery albums" value={stats?.totalGalleryAlbums || 0} icon={Globe2} accent="#a78bfa" />
              </div>

              <PortalSection title="Readiness checklist" description="A simple completeness summary keeps the public site launch-ready without exposing a cluttered audit table.">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {completionItems.map(([label, complete]) => (
                    <div key={label} className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{label}</span>
                      <span style={{ color: complete ? '#34d399' : '#fbbf24', fontWeight: 800 }}>{complete ? 'Ready' : 'Needs work'}</span>
                    </div>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}

          {tab === 'profile' ? (
            <PortalSection
              title="School profile"
              description="This section controls the hero, about content, address, and publishing status for the public school landing page."
              action={
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => toggleProfilePublish(!(profile.isPublished ?? false))} isLoading={saving === 'publish'}>
                    {(profile.isPublished ?? false) ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button onClick={saveProfile} isLoading={saving === 'profile'}>Save profile</Button>
                </div>
              }
            >
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
                    <input className="input-field" value={(profile as any)[key] || ''} onChange={(event) => setProfile((current) => current ? ({ ...current, [key]: event.target.value }) : current)} />
                  </label>
                ))}
                <label className="grid gap-2 xl:col-span-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Short description</span>
                  <textarea className="input-field" rows={3} value={profile.shortDescription || ''} onChange={(event) => setProfile((current) => current ? ({ ...current, shortDescription: event.target.value }) : current)} />
                </label>
                <label className="grid gap-2 xl:col-span-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>About content</span>
                  <textarea className="input-field" rows={6} value={profile.aboutHtml || ''} onChange={(event) => setProfile((current) => current ? ({ ...current, aboutHtml: event.target.value }) : current)} />
                </label>
                <label className="grid gap-2 xl:col-span-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Objective</span>
                  <textarea className="input-field" rows={4} value={profile.objective || ''} onChange={(event) => setProfile((current) => current ? ({ ...current, objective: event.target.value }) : current)} />
                </label>
                <label className="grid gap-2 xl:col-span-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Address line 1</span>
                  <input className="input-field" value={profile.addressLine1 || ''} onChange={(event) => setProfile((current) => current ? ({ ...current, addressLine1: event.target.value }) : current)} />
                </label>
              </div>
            </PortalSection>
          ) : null}

          {tab === 'content' ? (
            <>
              <PortalSection title="Admission content" description="These fields feed the public admissions section and enquiry CTA panel." action={<Button onClick={saveAdmission} isLoading={saving === 'admission'}>Save admissions</Button>}>
                <div className="grid gap-4">
                  {[
                    ['Overview', 'overview', 4],
                    ['Eligibility', 'eligibility', 4],
                    ['Process', 'process', 4],
                  ].map(([label, key, rows]) => (
                    <label key={key} className="grid gap-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                      <textarea className="input-field" rows={rows as number} value={(admissionInfo as any)[key] || ''} onChange={(event) => setAdmissionInfo((current) => current ? ({ ...current, [key]: event.target.value }) : current)} />
                    </label>
                  ))}
                </div>
              </PortalSection>

              <PortalSection title="Academic content" description="Curriculum, co-curriculars, notices, and results all roll into the public school experience." action={<Button onClick={saveAcademics} isLoading={saving === 'academics'}>Save academics</Button>}>
                <div className="grid gap-4">
                  {[
                    ['Curriculum', 'curriculum', 4],
                    ['Co-curricular', 'coCurricular', 4],
                    ['Scholarship info', 'scholarshipInfo', 3],
                    ['Result highlights', 'resultHighlights', 3],
                    ['Notices', 'notices', 3],
                    ['Calendar data', 'calendarData', 3],
                  ].map(([label, key, rows]) => (
                    <label key={key} className="grid gap-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                      <textarea className="input-field" rows={rows as number} value={(academicContent as any)[key] || ''} onChange={(event) => setAcademicContent((current) => current ? ({ ...current, [key]: event.target.value }) : current)} />
                    </label>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}

          {tab === 'leadership' ? (
            <>
              <PortalSection title="Add leader" description="Create founder, principal, director, or chairperson blocks that appear on the public site.">
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Type</span>
                    <input className="input-field" value={leaderDraft.type} onChange={(event) => setLeaderDraft((current) => ({ ...current, type: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Name</span>
                    <input className="input-field" value={leaderDraft.name} onChange={(event) => setLeaderDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Title</span>
                    <input className="input-field" value={leaderDraft.title} onChange={(event) => setLeaderDraft((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Bio</span>
                    <textarea className="input-field" rows={4} value={leaderDraft.bio} onChange={(event) => setLeaderDraft((current) => ({ ...current, bio: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Message</span>
                    <textarea className="input-field" rows={4} value={leaderDraft.message} onChange={(event) => setLeaderDraft((current) => ({ ...current, message: event.target.value }))} />
                  </label>
                  <Button onClick={createLeader} isLoading={saving === 'leader'}>Add leader</Button>
                </div>
              </PortalSection>

              <PortalSection title="Published leadership blocks" description="Current leadership cards in display order.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                      <div style={{ color: '#22d3ee', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>{leader.type}</div>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{leader.name}</div>
                      <div style={{ color: 'var(--text-dim)' }}>{leader.title || 'Leadership profile'}</div>
                    </div>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}

          {tab === 'events' ? (
            <>
              <PortalSection title="Create event" description="Upcoming events flow straight into the public landing page event showcase.">
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Title</span>
                    <input className="input-field" value={eventDraft.title} onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Start time</span>
                    <input className="input-field" type="datetime-local" value={eventDraft.startAt} onChange={(event) => setEventDraft((current) => ({ ...current, startAt: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Location</span>
                    <input className="input-field" value={eventDraft.location} onChange={(event) => setEventDraft((current) => ({ ...current, location: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Registration URL</span>
                    <input className="input-field" value={eventDraft.registrationUrl} onChange={(event) => setEventDraft((current) => ({ ...current, registrationUrl: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Description</span>
                    <textarea className="input-field" rows={4} value={eventDraft.description} onChange={(event) => setEventDraft((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <Button onClick={createEvent} isLoading={saving === 'event'}>Create event</Button>
                </div>
              </PortalSection>

              <PortalSection title="Scheduled events" description="This list drives the featured-event and upcoming-event cards on the public site.">
                <div className="grid gap-4 lg:grid-cols-2">
                  {events.map((event) => (
                    <div key={event.id} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                      <div style={{ color: '#22d3ee', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                        {event.isFeatured ? 'Featured event' : 'Upcoming event'}
                      </div>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{event.title}</div>
                      <div style={{ color: 'var(--text-dim)' }}>{event.startAt || 'Date pending'} - {event.location || 'Campus venue'}</div>
                    </div>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}

          {tab === 'operations' ? (
            <>
              <PortalSection title="Branch manager" description="Branch details flow directly to the public branches section and contact context.">
                <div className="grid gap-4 xl:grid-cols-2">
                  {[
                    ['Branch name', 'branchName'],
                    ['Address', 'address'],
                    ['City', 'city'],
                    ['State', 'state'],
                    ['Phone', 'phone'],
                    ['Email', 'email'],
                  ].map(([label, key]) => (
                    <label key={key} className="grid gap-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>{label}</span>
                      <input className="input-field" value={(branchDraft as any)[key]} onChange={(event) => setBranchDraft((current) => ({ ...current, [key]: event.target.value }))} />
                    </label>
                  ))}
                  <Button onClick={createBranch} isLoading={saving === 'branch'}>Add branch</Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {branches.map((branch) => (
                    <div key={branch.id} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                      <div style={{ color: '#22d3ee', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                        {branch.isPrimary ? 'Primary branch' : 'Branch campus'}
                      </div>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{branch.branchName}</div>
                      <div style={{ color: 'var(--text-dim)' }}>{[branch.address, branch.city, branch.state].filter(Boolean).join(', ')}</div>
                    </div>
                  ))}
                </div>
              </PortalSection>

              <PortalSection title="Fee structure" description="Responsive fee cards are generated from these records on the public site.">
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Academic year</span>
                    <input className="input-field" value={feeDraft.academicYear} onChange={(event) => setFeeDraft((current) => ({ ...current, academicYear: event.target.value }))} />
                  </label>
                  <label className="grid gap-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Title</span>
                    <input className="input-field" value={feeDraft.title} onChange={(event) => setFeeDraft((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Description</span>
                    <textarea className="input-field" rows={3} value={feeDraft.description} onChange={(event) => setFeeDraft((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Structured data JSON</span>
                    <textarea className="input-field" rows={4} value={feeDraft.structuredDataJson} onChange={(event) => setFeeDraft((current) => ({ ...current, structuredDataJson: event.target.value }))} placeholder='[{"label":"Admission fee","value":"25000"}]' />
                  </label>
                  <Button onClick={createFeeStructure} isLoading={saving === 'fees'}>Add fee structure</Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {feeStructures.map((item) => (
                    <div key={item.id} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                      <div style={{ color: '#22d3ee', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>{item.academicYear}</div>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.title}</div>
                      <div style={{ color: 'var(--text-dim)' }}>{item.description || 'Fee details available on site.'}</div>
                    </div>
                  ))}
                </div>
              </PortalSection>

              <PortalSection title="Enquiry inbox" description="Public enquiries remain in the same school-admin shell for fast follow-up.">
                <div className="grid gap-4">
                  {enquiries.map((item) => (
                    <div key={item.id} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 10 }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.parentName || item.studentName || 'Unknown enquiry'}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{item.phone} - {item.email || 'No email'} - {item.classInterested || 'Class not selected'}</div>
                        </div>
                        <div style={{ color: item.status === 'OPEN' ? '#fbbf24' : '#34d399', fontWeight: 800 }}>{item.status}</div>
                      </div>
                      <div style={{ color: 'var(--text-dim)' }}>{item.message || 'No message provided.'}</div>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="secondary" disabled={saving === item.id} onClick={() => markEnquiry(item.id, 'IN_PROGRESS')}>Mark in progress</Button>
                        <Button disabled={saving === item.id} onClick={() => markEnquiry(item.id, 'RESOLVED')}>Resolve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </PortalSection>
            </>
          ) : null}

          {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
        </div>
      </div>
    </div>
  );
}
