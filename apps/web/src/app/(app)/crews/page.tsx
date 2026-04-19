'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, Lock, X, Eye, EyeOff, Crown, Tag, ChevronRight, RefreshCw } from 'lucide-react';
import { resolveUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  Study: '#7c6ff7', Sports: '#22c55e', Hobby: '#ec4899', Work: '#3b82f6', Game: '#f59e0b', Other: '#6b7280',
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

  const { data: publicCrews } = useQuery<Crew[]>({
    queryKey: ['crews', 'search', expSearch, expCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (expSearch) params.set('q', expSearch);
      if (expCategory) params.set('cat', expCategory);
      return api.get(`/crews?${params.toString()}`).then((r) => r.data);
    },
  });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-5xl mx-auto px-6 py-6 pb-20">

        {/* 전체 카드 */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>

          {/* 상단 헤더 영역 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h1 className="text-lg font-extrabold text-gray-900">크루</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await Promise.all([
                    qc.invalidateQueries({ queryKey: ['my-crews'] }),
                    qc.invalidateQueries({ queryKey: ['crews'] }),
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
                  className="text-sm font-semibold text-primary-500 hover:text-primary-600 underline underline-offset-2">
                  크루 탐색하기
                </button>
              </div>
            ) : filteredMyCrews.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            {publicCrews && publicCrews.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {publicCrews.map((crew) => (
                  <CrewCard
                    key={crew.id}
                    crew={crew}
                    isMine={myCrewIds.has(crew.id)}
                    onClick={() => !myCrewIds.has(crew.id) && setJoiningCrew(crew)}
                  />
                ))}
              </div>
            ) : publicCrews?.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-gray-500">크루가 없습니다</p>
                <p className="text-xs text-gray-400 mt-1">다른 키워드나 카테고리로 찾아보세요</p>
              </div>
            ) : null}
          </div>
          )}
          </div>{/* 탭+검색+그리드 끝 */}
        </div>{/* 전체 카드 끝 */}
      </div>

      {joiningCrew && <JoinModal crew={joiningCrew} onClose={() => setJoiningCrew(null)} />}
    </div>
  );
}
