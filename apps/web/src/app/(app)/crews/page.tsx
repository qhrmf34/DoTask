'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, Lock, X, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { resolveUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Crew {
  id: string;
  name: string;
  description?: string;
  bannerImage?: string;
  category: string;
  visibility: string;
  _count: { members: number };
  maxMembers: number;
}

const CATEGORIES = ['Study', 'Sports', 'Hobby', 'Work', 'Game', 'Other'];
const CATEGORY_LABELS: Record<string, string> = {
  Study: '공부', Sports: '스포츠', Hobby: '취미', Work: '업무', Game: '게임', Other: '기타',
};
const CATEGORY_COLORS: Record<string, string> = {
  Study: '#7c6ff7', Sports: '#22c55e', Hobby: '#ec4899', Work: '#3b82f6', Game: '#f59e0b', Other: '#6b7280',
};

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Banner */}
        <div className="relative h-28 flex items-center justify-center overflow-hidden"
          style={{ background: crew.bannerImage ? undefined : `linear-gradient(135deg, ${catColor}22, ${catColor}44)` }}>
          {crew.bannerImage
            ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
            : <Users className="h-12 w-12" style={{ color: catColor }} />
          }
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-500 hover:bg-white transition-colors shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 flex-1">{crew.name}</h3>
            {crew.visibility === 'PASSWORD' && <Lock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />}
          </div>
          {crew.description && <p className="text-sm text-gray-500 mb-3">{crew.description}</p>}

          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              <Users className="h-3 w-3" /> {crew._count.members}/{crew.maxMembers}명
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: catColor + '18', color: catColor }}>
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>

          {crew.visibility === 'PASSWORD' && (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">크루 비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
            <Button
              className="flex-1"
              onClick={handleJoin}
              disabled={loading || (crew.visibility === 'PASSWORD' && !password.trim())}
            >
              {loading ? '가입 중...' : '가입하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyCrewCard({ crew }: { crew: Crew }) {
  const catColor = CATEGORY_COLORS[crew.category] ?? '#6b7280';
  return (
    <Link href={`/crews/${crew.id}`} className="group block">
      <div className="card-hover overflow-hidden h-full">
        {/* Image or gradient header */}
        <div className="relative h-20 overflow-hidden"
          style={{ background: crew.bannerImage ? undefined : `linear-gradient(135deg, ${catColor}22, ${catColor}55)` }}>
          {crew.bannerImage
            ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-8 w-8 opacity-40" style={{ color: catColor }} />
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-bold text-gray-900 text-sm truncate">{crew.name}</h3>
                {crew.visibility === 'PASSWORD' && <Lock className="h-3 w-3 text-gray-400 shrink-0" />}
              </div>
              {crew.description && (
                <p className="text-xs text-gray-400 line-clamp-1">{crew.description}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Users className="h-3 w-3" /> {crew._count.members}명
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: catColor + '15', color: catColor }}>
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ExploreCrewCard({ crew, onJoinClick, isMine }: { crew: Crew; onJoinClick: (c: Crew) => void; isMine: boolean }) {
  const catColor = CATEGORY_COLORS[crew.category] ?? '#6b7280';
  const memberPct = Math.round((crew._count.members / crew.maxMembers) * 100);

  if (isMine) return <MyCrewCard crew={crew} />;

  return (
    <button onClick={() => onJoinClick(crew)} className="group block text-left w-full">
      <div className="card-hover overflow-hidden h-full">
        <div className="relative h-20 overflow-hidden"
          style={{ background: crew.bannerImage ? undefined : `linear-gradient(135deg, ${catColor}15, ${catColor}35)` }}>
          {crew.bannerImage
            ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-8 w-8 opacity-30" style={{ color: catColor }} />
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] font-bold text-white bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
              가입하기
            </span>
          </div>
        </div>
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-gray-900 text-sm truncate flex-1">{crew.name}</h3>
            {crew.visibility === 'PASSWORD' && <Lock className="h-3 w-3 text-gray-400 shrink-0" />}
          </div>
          {crew.description && (
            <p className="text-xs text-gray-400 line-clamp-1 mb-2">{crew.description}</p>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: catColor + '15', color: catColor }}>
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>
          {/* Member fill bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-400">{crew._count.members}/{crew.maxMembers}명</span>
              <span className="text-[10px] font-semibold" style={{ color: catColor }}>{memberPct}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${memberPct}%`, backgroundColor: catColor }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CrewsPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [joiningCrew, setJoiningCrew] = useState<Crew | null>(null);

  const { data: myCrews = [] } = useQuery<Crew[]>({
    queryKey: ['my-crews'],
    queryFn: () => api.get('/crews/my').then((r) => r.data).catch(() => []),
  });

  const myCrewIds = new Set(myCrews.map((c) => c.id));

  const { data: publicCrews } = useQuery<Crew[]>({
    queryKey: ['crews', 'search', search, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('cat', selectedCategory);
      return api.get(`/crews?${params.toString()}`).then((r) => r.data);
    },
  });

  const handleSearch = () => setSearch(q);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-20 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">크루</h1>
            <p className="text-sm text-gray-400 mt-0.5">함께 성장할 크루를 찾아보세요</p>
          </div>
          <Link href="/crews/new">
            <Button size="sm" className="shadow-sm shadow-primary-200">
              <Plus className="h-4 w-4" /> 크루 만들기
            </Button>
          </Link>
        </div>

        {/* My Crews */}
        {myCrews.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-gray-700">내 크루</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{myCrews.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myCrews.map((crew) => (
                <MyCrewCard key={crew.id} crew={crew} />
              ))}
            </div>
          </section>
        )}

        {/* Explore */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">크루 탐색</h2>

          {/* Search */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="크루 이름으로 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>검색</Button>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                !selectedCategory ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
              )}
            >
              전체
            </button>
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c;
              const color = CATEGORY_COLORS[c];
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(active ? null : c)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all')}
                  style={active
                    ? { backgroundColor: color, borderColor: color, color: 'white' }
                    : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {publicCrews?.map((crew) => (
              <ExploreCrewCard
                key={crew.id}
                crew={crew}
                onJoinClick={setJoiningCrew}
                isMine={myCrewIds.has(crew.id)}
              />
            ))}
          </div>
          {publicCrews?.length === 0 && (
            <div className="card py-14 text-center col-span-3">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">검색 결과가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </section>
      </div>

      {joiningCrew && <JoinModal crew={joiningCrew} onClose={() => setJoiningCrew(null)} />}
    </div>
  );
}
