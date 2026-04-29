import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Loader, MapPin, UserRound } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentTimetableResponse } from '../../lib/schoolPortalApi';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const formatDayLabel = (day: string) => day.charAt(0) + day.slice(1).toLowerCase();

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState<StudentTimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [mode, setMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    let active = true;
    studentPortalApi.getTimetable()
      .then((response) => {
        if (active) setTimetable(response);
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load timetable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const orderedSchedule = useMemo(() => {
    const schedule = timetable?.schedule || [];
    return [...schedule].sort((left, right) => DAY_ORDER.indexOf(left.dayOfWeek) - DAY_ORDER.indexOf(right.dayOfWeek));
  }, [timetable?.schedule]);

  useEffect(() => {
    if (!orderedSchedule.length) return;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const todayIndex = orderedSchedule.findIndex((item) => item.dayOfWeek === today);
    setSelectedDay(todayIndex >= 0 ? todayIndex : 0);
  }, [orderedSchedule]);

  const activeDay = useMemo(() => orderedSchedule[selectedDay], [orderedSchedule, selectedDay]);

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading timetable" description="Fetching day and week schedules." accent="#22d3ee" />;
  }

  if (!timetable || !orderedSchedule.length) {
    return <PortalStatePanel title="Timetable unavailable" description={message || 'No timetable has been published yet.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Timetable"
        title="Daily and weekly class schedule"
        description="Students can switch between a quick day view and a full weekly overview without leaving the main shell."
        actions={
          <div className="flex items-center gap-3">
            <Button variant={mode === 'day' ? 'primary' : 'secondary'} onClick={() => setMode('day')}>Day view</Button>
            <Button variant={mode === 'week' ? 'primary' : 'secondary'} onClick={() => setMode('week')}>Week view</Button>
          </div>
        }
      />

      <PortalSection title="Schedule navigator" description="Tap a day to focus the detailed period cards.">
        <div className="flex flex-wrap gap-3">
          {orderedSchedule.map((item, index) => (
            <button
              key={item.dayOfWeek}
              type="button"
              className={index === selectedDay ? 'primary-button' : 'secondary-button'}
              onClick={() => setSelectedDay(index)}
            >
              {formatDayLabel(item.dayOfWeek)}
            </button>
          ))}
        </div>
      </PortalSection>

      {mode === 'day' && activeDay ? (
        <PortalSection title={`${formatDayLabel(activeDay.dayOfWeek)} periods`} description="Current day detail with subject, teacher, time, and room.">
          <div className="grid gap-4 lg:grid-cols-2">
            {activeDay.periods.length ? activeDay.periods.map((period) => (
              <div key={`${activeDay.dayOfWeek}-${period.periodNumber}`} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 10 }}>
                <div className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                    Period {period.periodNumber}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{period.startTime} - {period.endTime}</span>
                </div>
                <div style={{ color: 'var(--text-strong)', fontSize: '1.1rem', fontWeight: 800 }}>{period.subjectName}</div>
                <div className="grid gap-2" style={{ color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserRound size={14} /> {period.teacherName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock3 size={14} /> {period.startTime} - {period.endTime}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} /> {period.room || 'Room not set yet'}</span>
                </div>
              </div>
            )) : (
              <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>
                No periods are scheduled for this day yet.
              </div>
            )}
          </div>
        </PortalSection>
      ) : null}

      {mode === 'week' ? (
        <PortalSection title="Weekly overview" description="Condensed week view for quick scanning across all days.">
          <div className="grid gap-4 xl:grid-cols-2">
            {orderedSchedule.map((day) => (
              <div key={day.dayOfWeek} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
                <div className="flex items-center gap-10">
                  <CalendarDays size={18} color="#ffb663" />
                  <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{formatDayLabel(day.dayOfWeek)}</div>
                </div>
                <div className="grid gap-3">
                  {day.periods.length ? day.periods.map((period) => (
                    <div key={`${day.dayOfWeek}-${period.periodNumber}`} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{period.subjectName}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{period.startTime} - {period.endTime} - {period.teacherName}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)' }}>
                      No scheduled periods for this day.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PortalSection>
      ) : null}
    </div>
  );
}
