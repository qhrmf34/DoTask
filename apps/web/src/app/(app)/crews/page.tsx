'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, Lock, X, Eye, EyeOff, Crown, Tag, ChevronRight, RefreshCw, Bell, CheckSquare, Square, FileText, MessageCircle, ThumbsUp, UserPlus, ShieldCheck, ArrowRight, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { resolveUrl, formatRelativeTime, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';
import api from '@/lib/api';

interface CrewOwner { id: string; nickname: string; profileImage?: string }
interface Crew {
  id: string;
  name: string;
  description?: string;
  bannerImage?: string;
  emoji?: string;
  category: string;
  visibility: string;
  tags?: string[];
  _count: { members: number };
  maxMembers: number;
  members?: { user: CrewOwner }[];
}

const CATEGORIES = ['Study', 'Sports', 'Hobby', 'Work', 'Game', 'Other'];
const CATEGORY_LABELS: Record<string, string> = {
  Study: '공부', Sports: '스포츠', Hobby: '취미', Work: '업무', Game: '게임', Other: '기타',
};
const CATEGORY_COLORS: Record<string, string> = {
  Study: '#ff6b8b', Sports: '#22c55e', Hobby: '#ec4899', Work: '#3b82f6', Game: '#f59e0b', Other: '#6b7280',
};

function getOwner(crew: Crew): CrewOwner | null {
  return crew.members?.[0]?.user ?? null;
}

/* ─── 가입 모달 ─────────────────────────────────── */
function JoinModal({ crew, onClose }: { crew: Crew; onClose: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true); setError('');
    try {
      await api.post(`/crews/${crew.id}/join`, crew.visibility === 'PASSWORD' ? { password } : {});
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      onClose();
      router.push(`/crews/${crew.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const catColor = CATEGORY_COLORS[crew.category] ?? '#6b7280';
  const memberPct = Math.round((crew._count.members / crew.maxMembers) * 100);
  const owner = getOwner(crew);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="relative h-40 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${catColor}40, ${catColor}80)` }}>
          {crew.bannerImage && (
            <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-12">
            <h3 className="text-xl font-extrabold text-white leading-tight drop-shadow">{crew.name}</h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 inline-block"
              style={{ backgroundColor: catColor + 'cc', color: 'white' }}>
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>
          <button onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {crew.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{crew.description}</p>
          )}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50">
            {owner && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar src={owner.profileImage} fallback={owner.nickname} size="sm" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium">방장</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{owner.nickname}</p>
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">멤버</p>
              <p className="text-sm font-bold text-gray-800">
                {crew._count.members}<span className="text-gray-400 text-xs font-normal">/{crew.maxMembers}</span>
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-400">모집 현황</span>
              <span className="text-xs font-bold" style={{ color: catColor }}>{memberPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${memberPct}%`, backgroundColor: catColor }} />
            </div>
          </div>
          {crew.tags && crew.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {crew.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  <Tag className="h-2.5 w-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}
          {crew.visibility === 'PASSWORD' && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">크루 비밀번호</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="비밀번호를 입력하세요" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()} autoFocus />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleJoin}
              disabled={loading || (crew.visibility === 'PASSWORD' && !password.trim())}>
              {loading ? '가입 중...' : '가입하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 크루 카드 ─────────────────────────────────── */
function CrewCard({
  crew, onClick, isMine,
}: {
  crew: Crew;
  onClick?: () => void;
  isMine?: boolean;
}) {
  const catColor = CATEGORY_COLORS[crew.category] ?? '#6b7280';
  const owner = getOwner(crew);
  const memberPct = Math.round((crew._count.members / crew.maxMembers) * 100);

  const inner = (
    <div className={cn(
      'group bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 h-full flex flex-col',
    )}
      style={{ border: isMine ? `1.5px solid ${catColor}60` : '1px solid #e5e7eb' }}>

      {/* 배너 */}
      <div className="relative h-32 overflow-hidden shrink-0"
        style={{ background: `linear-gradient(135deg, ${catColor}30, ${catColor}65)` }}>
        {crew.bannerImage && (
          <img src={resolveUrl(crew.bannerImage)} alt={crew.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* 좌상단 - 카테고리 */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: catColor + 'ee' }}>
            {CATEGORY_LABELS[crew.category] ?? crew.category}
          </span>
          {crew.visibility === 'PASSWORD' && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black/30 backdrop-blur-sm">
              <Lock className="h-3 w-3 text-white" />
            </span>
          )}
        </div>

        {/* 우상단 - 가입됨 */}
        {isMine && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90"
              style={{ color: catColor }}>
              가입됨
            </span>
          </div>
        )}

        {/* 우하단 - 멤버 수 */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="flex items-center gap-1 text-xs font-bold text-white bg-black/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            <Users className="h-3 w-3" />{crew._count.members}<span className="text-white/70 font-normal">/{crew.maxMembers}</span>
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{crew.name}</p>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-0.5" />
        </div>
        {crew.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3 flex-1">{crew.description}</p>
        )}

        {/* 진행 게이지 */}
        <div className="mb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${memberPct}%`, backgroundColor: catColor }} />
          </div>
        </div>

        {/* 방장 */}
        {owner && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-gray-50">
            <Avatar src={owner.profileImage} fallback={owner.nickname} size="xs" />
            <span className="text-xs text-gray-500 truncate flex-1">{owner.nickname}</span>
            <Crown className="h-3 w-3 text-amber-400 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );

  if (isMine) {
    return <Link href={`/crews/${crew.id}`} className="block h-full">{inner}</Link>;
  }
  return <button onClick={onClick} className="group block w-full text-left h-full">{inner}</button>;
}

/* ─── 검색 + 필터 공통 컴포넌트 ────────────────── */
function SearchFilter({
  q, onQChange, onSearch, selectedCategory, onCategoryChange,
}: {
  q: string;
  onQChange: (v: string) => void;
  onSearch: () => void;
  selectedCategory: string | null;
  onCategoryChange: (v: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="크루 이름으로 검색"
            value={q} onChange={(e) => onQChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
        </div>
        <Button variant="secondary" onClick={onSearch}>검색</Button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0',
            !selectedCategory ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50',
          )}
        >전체</button>
        {CATEGORIES.map((c) => {
          const active = selectedCategory === c;
          const color = CATEGORY_COLORS[c];
          return (
            <button key={c}
              onClick={() => onCategoryChange(active ? null : c)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0"
              style={active
                ? { backgroundColor: color, borderColor: color, color: 'white' }
                : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
              {CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 알림 타입별 설정 ─────────────────────────── */
function getNotifIcon(type: string) {
  if (type === 'NEW_POST') return { icon: <FileText className="h-3.5 w-3.5" />, bg: 'bg-violet-50', color: 'text-violet-500' };
  if (type?.includes('COMMENT')) return { icon: <MessageCircle className="h-3.5 w-3.5" />, bg: 'bg-amber-50', color: 'text-amber-500' };
  if (type?.includes('REACTION')) return { icon: <ThumbsUp className="h-3.5 w-3.5" />, bg: 'bg-pink-50', color: 'text-pink-500' };
  if (type?.includes('CREW') || type?.includes('JOIN')) return { icon: <UserPlus className="h-3.5 w-3.5" />, bg: 'bg-green-50', color: 'text-green-500' };
  if (type === 'REPORT_PROCESSED') return { icon: <ShieldCheck className="h-3.5 w-3.5" />, bg: 'bg-blue-50', color: 'text-blue-500' };
  return { icon: <Bell className="h-3.5 w-3.5" />, bg: 'bg-gray-100', color: 'text-gray-400' };
}

/* ─── 오른쪽 사이드바 패널들 ──────────────────── */
function RecentNotificationsPanel() {
  const { data } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => api.get('/notifications').then((r) => r.data).catch(() => ({ items: [] })),
  });
  const items: any[] = (data?.items ?? []).slice(0, 5);
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-sm font-bold text-gray-900">최근 알림</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{unread}</span>
          )}
        </div>
        <Link href="/notifications" className="text-[11px] font-semibold text-violet-500 hover:text-primary-700 flex items-center gap-0.5">
          전체 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-6 flex flex-col items-center gap-2">
          <Bell className="h-8 w-8 text-gray-200" />
          <p className="text-xs text-gray-400">알림이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((n) => {
            const cfg = getNotifIcon(n.type);
            return (
              <Link
                key={n.id}
                href="/notifications"
                className={cn('flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors', !n.isRead && 'bg-violet-50/30')}
              >
                <div className={cn('h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs leading-snug truncate', n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold')}>{n.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TodayTodosPanel() {
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todos = [] } = useQuery<any[]>({
    queryKey: ['todos', today],
    queryFn: () => api.get(`/todos?date=${today}`).then((r) => r.data).catch(() => []),
  });

  const done = todos.filter((t) => t.isCompleted).length;
  const total = todos.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const toggleTodo = async (id: string) => {
    qc.setQueryData(['todos', today], (prev: any[]) =>
      (prev ?? []).map((t) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t),
    );
    try {
      await api.patch(`/todos/${id}/complete`);
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      qc.invalidateQueries({ queryKey: ['calendar', year, month] });
      qc.invalidateQueries({ queryKey: ['todos-monthly-stats', year, month] });
    } catch {
      qc.invalidateQueries({ queryKey: ['todos', today] });
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <ListTodo className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-sm font-bold text-gray-900">오늘 할일</span>
        </div>
        <Link href="/todos" className="text-[11px] font-semibold text-violet-500 hover:text-primary-700 flex items-center gap-0.5">
          전체 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-4 py-3">
        {/* 진행률 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', pct >= 100 ? 'bg-mint-400' : 'progress-shimmer')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold tabular-nums shrink-0', pct >= 100 ? 'text-mint-500' : 'text-primary-600')}>{pct}%</span>
          <span className="text-[11px] text-gray-400 shrink-0">{done}/{total}</span>
        </div>

        {total === 0 ? (
          <div className="py-4 flex flex-col items-center gap-2">
            <img src="/mascot/mascot_waiting.png" alt="" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
            <p className="text-xs text-gray-400">오늘 할일을 추가해보세요</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todos.slice(0, 5).map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTodo(t.id)}
                className="w-full flex items-center gap-2.5 px-1 py-0.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                {t.isCompleted
                  ? <CheckSquare className="h-4 w-4 text-mint-500 shrink-0" />
                  : <Square className="h-4 w-4 text-gray-300 shrink-0" />
                }
                <span className={cn('text-xs truncate', t.isCompleted ? 'line-through text-gray-400' : 'text-gray-700')}>
                  {t.title}
                </span>
              </button>
            ))}
            {todos.length > 5 && (
              <p className="text-[11px] text-gray-400 pl-1 pt-1">+{todos.length - 5}개 더</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 메인 ─────────────────────────────────────── */
export default function CrewsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'mine' | 'explore'>('explore');
  const [refreshing, setRefreshing] = useState(false);

  // 내 크루 탭 검색
  const [myQ, setMyQ] = useState('');
  const [mySearch, setMySearch] = useState('');
  const [myCategory, setMyCategory] = useState<string | null>(null);

  // 탐색 탭 검색
  const [expQ, setExpQ] = useState('');
  const [expSearch, setExpSearch] = useState('');
  const [expCategory, setExpCategory] = useState<string | null>(null);

  const [joiningCrew, setJoiningCrew] = useState<Crew | null>(null);

  const { data: myCrews = [] } = useQuery<Crew[]>({
    queryKey: ['my-crews'],
    queryFn: () => api.get('/crews/my').then((r) => r.data).catch(() => []),
  });

  const myCrewIds = new Set(myCrews.map((c) => c.id));

  // 내 크루 로컬 필터
  const filteredMyCrews = useMemo(() => {
    return myCrews.filter((c) => {
      const matchQ = !mySearch || c.name.toLowerCase().includes(mySearch.toLowerCase());
      const matchCat = !myCategory || c.category === myCategory;
      return matchQ && matchCat;
    });
  }, [myCrews, mySearch, myCategory]);

  const {
    data: publicCrewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['crews', 'search', expSearch, expCategory],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (expSearch) params.set('q', expSearch);
      if (expCategory) params.set('cat', expCategory);
      if (pageParam) params.set('cursor', pageParam);
      return api.get(`/crews?${params.toString()}`).then((r) => r.data);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const publicCrews = useMemo(
    () => publicCrewsData?.pages.flatMap((p: any) => p.data) ?? [],
    [publicCrewsData],
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: '200px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-6xl mx-auto px-6 py-6 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-5 items-start">

          {/* ── 메인 카드 ── */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h1 className="text-lg font-extrabold text-gray-900">크루</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    await Promise.all([
                      qc.invalidateQueries({ queryKey: ['my-crews'] }),
                      qc.resetQueries({ queryKey: ['crews', 'search'] }),
                    ]);
                    setTimeout(() => setRefreshing(false), 600);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className={`h-3.5 w-3.5 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <Link href="/crews/new">
                  <Button size="sm" className="gap-1.5 shrink-0">
                    <Plus className="h-4 w-4" /> 크루 만들기
                  </Button>
                </Link>
              </div>
            </div>

            {/* 탭 + 검색 + 그리드 */}
            <div className="px-6 py-5 space-y-4">
              {/* 탭 */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl max-w-xs">
                {(['explore', 'mine'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                      tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                    )}
                  >
                    {t === 'explore' ? '크루 탐색' : (
                      <>내 크루{myCrews.length > 0 && (
                        <span className={cn('ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full', tab === 'mine' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500')}>
                          {myCrews.length}
                        </span>
                      )}</>
                    )}
                  </button>
                ))}
              </div>

              {/* 내 크루 탭 */}
              {tab === 'mine' && (
                <div className="space-y-5">
                  <SearchFilter
                    q={myQ} onQChange={setMyQ} onSearch={() => setMySearch(myQ)}
                    selectedCategory={myCategory} onCategoryChange={setMyCategory}
                  />
                  {myCrews.length === 0 ? (
                    <div className="py-24 text-center">
                      <p className="text-base font-semibold text-gray-500">아직 가입한 크루가 없어요</p>
                      <p className="text-sm text-gray-400 mt-1 mb-5">크루를 탐색하거나 직접 만들어보세요</p>
                      <button onClick={() => setTab('explore')}
                        className="text-sm font-semibold text-violet-500 hover:text-primary-600 underline underline-offset-2">
                        크루 탐색하기
                      </button>
                    </div>
                  ) : filteredMyCrews.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filteredMyCrews.map((crew) => (
                        <CrewCard key={crew.id} crew={crew} isMine />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 탐색 탭 */}
              {tab === 'explore' && (
                <div className="space-y-5">
                  <SearchFilter
                    q={expQ} onQChange={setExpQ} onSearch={() => setExpSearch(expQ)}
                    selectedCategory={expCategory} onCategoryChange={setExpCategory}
                  />
                  {publicCrews.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {publicCrews.map((crew) => (
                          <CrewCard
                            key={crew.id}
                            crew={crew}
                            isMine={myCrewIds.has(crew.id)}
                            onClick={() => !myCrewIds.has(crew.id) && setJoiningCrew(crew)}
                          />
                        ))}
                      </div>
                      <div ref={loadMoreRef} className="py-2 flex justify-center">
                        {isFetchingNextPage && (
                          <div className="h-5 w-5 border-2 border-gray-200 border-t-primary-400 rounded-full animate-spin" />
                        )}
                      </div>
                    </>
                  ) : publicCrewsData ? (
                    <div className="py-16 text-center">
                      <p className="text-sm font-semibold text-gray-500">크루가 없습니다</p>
                      <p className="text-xs text-gray-400 mt-1">다른 키워드나 카테고리로 찾아보세요</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ── 오른쪽 사이드바 ── */}
          <div className="hidden xl:flex flex-col gap-4 sticky top-6 self-start">
            <PomodoroTimer />
            <MiniCalendar />
            <RecentNotificationsPanel />
            <TodayTodosPanel />
          </div>

        </div>
      </div>

      {joiningCrew && <JoinModal crew={joiningCrew} onClose={() => setJoiningCrew(null)} />}
    </div>
  );
}
