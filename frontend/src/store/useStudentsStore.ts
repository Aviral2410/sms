import { create } from 'zustand';
import { schoolOpsApi, type StudentRowResponse, type StudentsPageResponse } from '../lib/api';

export type StudentsQuery = {
  schoolId: string;
  search: string;
  classId: string;
  section: string;
  transport: string;
  status: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  size: number;
};

type CacheEntry = {
  data: StudentsPageResponse;
  timestamp: number;
};

type StudentsState = {
  cache: Record<string, CacheEntry>;
  ttlMs: number;
  makeKey: (query: StudentsQuery) => string;
  fetchStudents: (query: StudentsQuery, force?: boolean) => Promise<StudentsPageResponse>;
  invalidateStudents: (schoolId: string) => void;
  updateCachedRow: (schoolId: string, studentId: string, updater: (prev: StudentRowResponse) => StudentRowResponse) => void;
};

function normalizeQuery(query: StudentsQuery) {
  return {
    schoolId: query.schoolId,
    search: query.search,
    classId: query.classId,
    section: query.section,
    transport: query.transport,
    status: query.status,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: query.page,
    size: query.size,
  };
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  cache: {},
  ttlMs: 45_000,
  makeKey: (query) => JSON.stringify(normalizeQuery(query)),
  fetchStudents: async (query, force = false) => {
    const key = get().makeKey(query);
    const cached = get().cache[key];
    const now = Date.now();

    if (!force && cached && now - cached.timestamp < get().ttlMs) {
      return cached.data;
    }

    const data = await schoolOpsApi.getStudents({
      schoolId: query.schoolId,
      search: query.search || undefined,
      classId: query.classId === 'ALL' ? undefined : query.classId,
      section: query.section === 'ALL' ? undefined : query.section,
      transport: query.transport === 'ALL' ? undefined : query.transport,
      status: query.status === 'ALL' ? undefined : query.status,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      page: query.page,
      size: query.size,
    });

    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp: now },
      },
    }));

    return data;
  },
  invalidateStudents: (schoolId) => {
    set((state) => {
      const nextCache: Record<string, CacheEntry> = {};
      for (const [key, value] of Object.entries(state.cache)) {
        if (!key.includes(`"schoolId":"${schoolId}"`)) {
          nextCache[key] = value;
        }
      }
      return { cache: nextCache };
    });
  },
  updateCachedRow: (schoolId, studentId, updater) => {
    set((state) => {
      const nextCache: Record<string, CacheEntry> = {};
      for (const [key, value] of Object.entries(state.cache)) {
        if (!key.includes(`"schoolId":"${schoolId}"`)) {
          nextCache[key] = value;
          continue;
        }
        nextCache[key] = {
          ...value,
          data: {
            ...value.data,
            items: value.data.items.map((item) =>
              item.studentUserId === studentId ? updater(item) : item,
            ),
          },
        };
      }
      return { cache: nextCache };
    });
  },
}));
