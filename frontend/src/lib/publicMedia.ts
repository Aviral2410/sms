type PublicAnnouncementLike = {
  announcementId?: string;
  title?: string;
  content?: string;
  type?: string;
  priority?: string;
  publishedAt?: string;
  createdAt?: string;
  imageUrl?: string;
  mediaUrl?: string;
  img?: string;
  date?: string;
};

export interface PublicEventCard {
  id: string;
  title: string;
  summary: string;
  type: string;
  dateLabel: string;
  imageSrc: string;
  fallbackSrc: string;
}

const TYPE_IMAGE_MAP: Record<string, string> = {
  ACADEMIC: '/classroom.png',
  CLASS: '/classroom.png',
  EXAM: '/classroom.png',
  ANNOUNCEMENT: '/school_facade.png',
  NOTICE: '/school_facade.png',
  EVENT: '/hero.png',
  CELEBRATION: '/hero.png',
  ADMISSION: '/hero.png',
};

function isRenderableRemote(url: string | undefined) {
  return Boolean(url && /^(https?:\/\/|\/)/i.test(url));
}

export function resolvePublicEventFallback(type?: string) {
  return TYPE_IMAGE_MAP[(type || 'ANNOUNCEMENT').toUpperCase()] || '/school_facade.png';
}

export function formatPublicEventDate(dateLike?: string) {
  if (!dateLike) return 'Latest update';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return dateLike;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function mapAnnouncementToPublicEventCard(
  item: PublicAnnouncementLike,
  index: number,
): PublicEventCard {
  const type = (item.type || 'ANNOUNCEMENT').toUpperCase();
  const fallbackSrc = resolvePublicEventFallback(type);
  const imageSrc = isRenderableRemote(item.imageUrl)
    ? item.imageUrl!
    : isRenderableRemote(item.mediaUrl)
      ? item.mediaUrl!
      : isRenderableRemote(item.img)
        ? item.img!
        : fallbackSrc;

  return {
    id: item.announcementId || `${type}-${index}`,
    title: item.title || 'Campus update',
    summary: item.content || 'A new update is available for the school community.',
    type,
    dateLabel: item.date || formatPublicEventDate(item.publishedAt || item.createdAt),
    imageSrc,
    fallbackSrc,
  };
}

export function buildDefaultPublicEventCards(schoolName?: string): PublicEventCard[] {
  return [
    {
      id: 'academic-calendar',
      title: `${schoolName || 'School'} Academic Session`,
      summary: 'The latest academic calendar, classroom rhythms, and student milestones are now underway.',
      type: 'ACADEMIC',
      dateLabel: 'Current term',
      imageSrc: '/classroom.png',
      fallbackSrc: '/classroom.png',
    },
    {
      id: 'community-notice',
      title: 'Campus community notice',
      summary: 'New announcements, parent communication, and institutional updates are available on the portal.',
      type: 'ANNOUNCEMENT',
      dateLabel: 'Latest update',
      imageSrc: '/school_facade.png',
      fallbackSrc: '/school_facade.png',
    },
    {
      id: 'student-life',
      title: 'Student life highlights',
      summary: 'Celebrate activities, achievements, and events from across the learning community.',
      type: 'EVENT',
      dateLabel: 'This season',
      imageSrc: '/hero.png',
      fallbackSrc: '/hero.png',
    },
  ];
}
