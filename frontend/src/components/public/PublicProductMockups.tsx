import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  Bus,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react';

const HERO_MODULES = [
  {
    key: 'admissions',
    label: 'Admissions',
    icon: Users,
    accent: 'from-cyan-400 to-sky-500',
    summary: '42 active applications',
    stats: [
      { label: 'Applications', value: '42' },
      { label: 'Interviews', value: '18' },
      { label: 'Offer rate', value: '76%' },
    ],
    timeline: [
      { label: 'Application received', time: '09:10', status: 'done' },
      { label: 'Documents verified', time: '09:42', status: 'done' },
      { label: 'Counsellor follow-up', time: '11:15', status: 'next' },
    ],
    details: [
      { label: 'High-intent applicants', value: '14', note: 'Students with completed documentation and interview readiness.' },
      { label: 'Parent callbacks due', value: '6', note: 'Counsellor outreach queued before noon for conversion support.' },
      { label: 'Scholarship reviews', value: '3', note: 'Awaiting finance + leadership approval in the same flow.' },
    ],
  },
  {
    key: 'academics',
    label: 'Academics',
    icon: GraduationCap,
    accent: 'from-emerald-400 to-teal-500',
    summary: '96.2% attendance stability',
    stats: [
      { label: 'Classes live', value: '128' },
      { label: 'At-risk students', value: '9' },
      { label: 'Homework sent', value: '84%' },
    ],
    timeline: [
      { label: 'Attendance synced', time: '08:05', status: 'done' },
      { label: 'Teacher notes posted', time: '10:20', status: 'done' },
      { label: 'Progress digest', time: '14:00', status: 'next' },
    ],
    details: [
      { label: 'Sections improving', value: '11', note: 'Consistency recovered after transport and timetable fixes.' },
      { label: 'Interventions open', value: '9', note: 'Attendance and performance follow-ups coordinated with class mentors.' },
      { label: 'Reports auto-drafted', value: '32', note: 'Teacher summaries prepared for leadership review.' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: CreditCard,
    accent: 'from-amber-300 to-orange-500',
    summary: '89% fees collected this cycle',
    stats: [
      { label: 'Collected', value: '₹84L' },
      { label: 'Pending', value: '₹10L' },
      { label: 'Autoreminders', value: '312' },
    ],
    timeline: [
      { label: 'Invoices published', time: '07:30', status: 'done' },
      { label: 'Parent reminders sent', time: '08:15', status: 'done' },
      { label: 'Collections review', time: '17:30', status: 'next' },
    ],
    details: [
      { label: 'High-risk dues', value: '₹4.8L', note: 'Families with overdue balances across more than one reminder cycle.' },
      { label: 'Payment plans active', value: '21', note: 'Structured collections in progress with finance follow-up.' },
      { label: 'Automation saves', value: '17 hr', note: 'Reminder, receipt, and reconciliation workload reduced weekly.' },
    ],
  },
];

const OPERATIONS_SCENARIOS = [
  {
    key: 'transport',
    label: 'Transport intelligence',
    title: 'Live route, safety, and parent visibility in one lane.',
    body: 'Track buses, trigger alerts, and keep transport teams and families on the same operational picture.',
    metrics: [
      { label: 'Routes running', value: '24' },
      { label: 'On-time departures', value: '97%' },
      { label: 'Alerts resolved', value: '11/12' },
    ],
    board: [
      { name: 'North Loop', status: 'On route', eta: '08 min' },
      { name: 'East Ridge', status: 'Boarding', eta: '02 min' },
      { name: 'River Park', status: 'Completed', eta: 'Done' },
    ],
    detailTitle: 'Route control panel',
    detailBody: 'Live ETAs, alert states, and family visibility stay tied to the same route context.',
    icon: Bus,
  },
  {
    key: 'communication',
    label: 'Communication command',
    title: 'Announcements, approvals, and follow-up without fragmented tools.',
    body: 'Move notices, parent communication, and team coordination through one controlled workflow with visible status.',
    metrics: [
      { label: 'Notices today', value: '18' },
      { label: 'Read rate', value: '91%' },
      { label: 'Pending replies', value: '7' },
    ],
    board: [
      { name: 'Fee reminder', status: 'Sent', eta: '2,140 parents' },
      { name: 'Exam update', status: 'Scheduled', eta: '16:30' },
      { name: 'Transport alert', status: 'Delivered', eta: '05 min ago' },
    ],
    detailTitle: 'Message workflow',
    detailBody: 'Teams can publish, approve, monitor read-rate, and follow up without switching systems.',
    icon: MessageSquareText,
  },
  {
    key: 'governance',
    label: 'Leadership controls',
    title: 'Leadership gets a clean operating picture instead of scattered dashboards.',
    body: 'Approvals, audit confidence, school-wide summaries, and AI-ready visibility all sit in one executive layer.',
    metrics: [
      { label: 'Policies active', value: '36' },
      { label: 'Open escalations', value: '3' },
      { label: 'Compliance score', value: '98%' },
    ],
    board: [
      { name: 'Budget approval', status: 'Awaiting sign-off', eta: 'CFO' },
      { name: 'Teacher hiring', status: 'Ready', eta: '2 candidates' },
      { name: 'Audit package', status: 'Prepared', eta: 'Today' },
    ],
    detailTitle: 'Executive control layer',
    detailBody: 'Leadership sees school-wide readiness, exceptions, and decision queues in one governed surface.',
    icon: ShieldCheck,
  },
];

const AURA_RESPONSES = [
  {
    prompt: 'Show me school-wide fee risk and likely collection blockers.',
    thought: 'Reviewing billing, reminders, and parent response patterns...',
    bullets: [
      'Grade 9 and Grade 11 drive most overdue exposure this week.',
      'Collection risk is concentrated in 53 families who also missed the last reminder.',
      'Recommended next step: trigger segmented follow-ups and flag counsellor outreach for top-risk accounts.',
    ],
  },
  {
    prompt: 'Summarize attendance risk for leadership in a board-ready format.',
    thought: 'Combining attendance signals, intervention notes, and class-level variance...',
    bullets: [
      'Attendance remains healthy overall, but three sections show repeated late-arrival clustering.',
      'Risk is highest where transport delays and low parent acknowledgement overlap.',
      'Recommended next step: route a morning-operations review and auto-generate parent follow-up lists.',
    ],
  },
  {
    prompt: 'How does rollout work for a growing multi-campus school group?',
    thought: 'Mapping onboarding, tenant setup, permissions, data migration, and training phases...',
    bullets: [
      'Start with one operating model, then replicate modules and policy controls campus by campus.',
      'Leadership retains group-wide visibility while each campus gets its own governed workspace.',
      'Recommended next step: align rollout by admissions cycle, finance closure, and staff training windows.',
    ],
  },
];

function useRotatingIndex(length: number, delay: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delay);

    return () => window.clearInterval(timer);
  }, [delay, length]);

  return [index, setIndex] as const;
}

export function PublicHeroProductMockup() {
  const [activeIndex, setActiveIndex] = useRotatingIndex(HERO_MODULES.length, 4200);
  const [detailIndex, setDetailIndex] = useState(0);
  const active = HERO_MODULES[activeIndex];
  const ActiveIcon = active.icon;

  useEffect(() => {
    setDetailIndex(0);
  }, [activeIndex]);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/70">Live product mockup</div>
          <div className="mt-2 text-lg font-semibold text-white">Leadership view</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Working preview
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {HERO_MODULES.map((module, index) => {
          const Icon = module.icon;
          const activeTab = activeIndex === index;
          return (
            <button
              key={module.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeTab
                  ? 'border-emerald-300/35 bg-emerald-500/12 text-white'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {module.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={active.key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.6fr)]"
      >
        <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${active.accent} text-slate-950`}>
                <ActiveIcon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{active.label}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{active.summary}</div>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
              Updated 2 min ago
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {active.stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-slate-900/85 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Operational flow</div>
              <div className="text-xs text-slate-400">Live queue</div>
            </div>
            <div className="mt-4 space-y-3">
              {active.timeline.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.status === 'done' ? 'bg-emerald-300' : 'bg-cyan-300'}`} />
                  <div className="min-w-0 flex-1 text-sm text-slate-200">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Attention layer</div>
            <div className="mt-3 space-y-3">
              {[78, 56, 91, 62].map((value, index) => (
                <div key={value + index}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>Signal {index + 1}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.6, delay: index * 0.08 }}
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Drilldown</div>
              <div className="text-xs text-slate-500">Click a detail</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.details.map((detail, index) => (
                <button
                  key={detail.label}
                  type="button"
                  onClick={() => setDetailIndex(index)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    detailIndex === index
                      ? 'border-emerald-300/35 bg-emerald-500/12 text-white'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {detail.label}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-slate-950/65 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-500/12 p-2 text-emerald-200">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{active.details[detailIndex]?.value}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {active.details[detailIndex]?.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PublicOperationsMockup() {
  const [activeIndex, setActiveIndex] = useRotatingIndex(OPERATIONS_SCENARIOS.length, 5200);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const scenario = OPERATIONS_SCENARIOS[activeIndex];
  const ScenarioIcon = scenario.icon;

  useEffect(() => {
    setSelectedRowIndex(0);
  }, [activeIndex]);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.96))] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/70">Working scenario</div>
          <div className="mt-2 text-xl font-semibold text-white">{scenario.label}</div>
        </div>
        <div className="flex gap-2">
          {OPERATIONS_SCENARIOS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 w-8 rounded-full transition ${index === activeIndex ? 'bg-emerald-300' : 'bg-white/10 hover:bg-white/20'}`}
              aria-label={`Show ${item.label}`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={scenario.key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(220px,0.7fr)]"
      >
        <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/70 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-200">
              <ScenarioIcon size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{scenario.body}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scenario.metrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-white">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Operations board</div>
            <div className="text-xs text-slate-400">Click any row</div>
          </div>
          <div className="mt-4 space-y-3">
            {scenario.board.map((row, index) => (
              <button
                key={row.name}
                type="button"
                onClick={() => setSelectedRowIndex(index)}
                className={`block w-full rounded-[1.1rem] border p-3 text-left transition ${
                  selectedRowIndex === index
                    ? 'border-emerald-300/25 bg-emerald-500/8'
                    : 'border-white/10 bg-slate-950/65 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">{row.name}</div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                    <CheckCircle2 size={12} />
                    {row.status}
                  </div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{row.eta}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-slate-950/65 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{scenario.detailTitle}</div>
            <div className="mt-2 text-sm font-semibold text-white">{scenario.board[selectedRowIndex]?.name}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{scenario.detailBody}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PublicAuraMockup() {
  const [activeIndex, setActiveIndex] = useRotatingIndex(AURA_RESPONSES.length, 5400);
  const response = AURA_RESPONSES[activeIndex];
  const completion = useMemo(() => 74 + activeIndex * 8, [activeIndex]);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/78 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/70">Aura live preview</div>
          <div className="mt-2 text-lg font-semibold text-white">Conversational school intelligence</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
          <Bot size={14} className="text-emerald-200" />
          Streaming
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {AURA_RESPONSES.map((item, index) => (
          <button
            key={item.prompt}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
              index === activeIndex
                ? 'border-emerald-300/35 bg-emerald-500/12 text-white'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            Prompt {index + 1}
          </button>
        ))}
      </div>

      <motion.div
        key={response.prompt}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mt-4 space-y-4"
      >
        <div className="rounded-[1.2rem] border border-cyan-400/15 bg-cyan-500/[0.08] px-4 py-3 text-sm leading-6 text-white">
          <div className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.2em] text-cyan-100/55">Prompt</div>
          {response.prompt}
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/12 p-2 text-emerald-200">
              <Bot size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-200/70">Aura thought</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{response.thought}</div>
              <div className="mt-3 h-2 rounded-full bg-white/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Structured response</div>
            <div className="inline-flex items-center gap-1 text-xs text-slate-400">
              Markdown
              <ArrowUpRight size={12} />
            </div>
          </div>
          <div className="space-y-3">
            {response.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
