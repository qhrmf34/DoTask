'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, Lock, Globe, X, Eye, EyeOff } from 'lucide-react';
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
  tags?: string[];
}

const CATEGORIES = ['Study', 'Sports', 'Hobby', 'Work', 'Game', 'Other'];
const CATEGORY_LABELS: Record<string, string> = {
  Study: '공부',
  Sports: '스포츠',
  Hobby: '취미',
  Work: '업무',
  Game: '게임',
  Other: '기타',
};

function JoinModal({ crew, onClose }: { crew: Crew; onClose: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/crews/${crew.id}/join`, crew.visibility === 'PASSWORD' ? { password } : {});
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      onClose();
      router.push(`/crews/${crew.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(msg ?? '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Banner / header */}
        <div className="relative h-24 bg-primary-100 flex items-center justify-center overflow-hidden">
          {crew.bannerImage ? (
            <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="h-10 w-10 text-primary-300" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{crew.name}</h3>
            {crew.visibility === 'PASSWORD' && <Lock className="h-4 w-4 text-gray-400 shrink-0" />}
          </div>
          {crew.description && (
            <p className="text-sm text-gray-500 mb-3">{crew.description}</p>
          )}
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              {crew._count.members}/{crew.maxMembers}명
            </span>
            <span className="text-xs text-gray-300 px-2 py-0.5 border border-gray-200 rounded-full">
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>

          {crew.visibility === 'PASSWORD' && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">크루 비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleJoin} disabled={loading || (crew.visibility === 'PASSWORD' && !password.trim())}>
              {loading ? '가입 중...' : '가입하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardBase = 'card-hover p-4 block text-left w-full';

function CrewCard({ crew, onJoinClick, isMine }: { crew: Crew; onJoinClick: (crew: Crew) => void; isMine: boolean }) {
  const content = (
    <div className="flex items-center gap-3.5">
      <div className="h-13 w-13 h-[52px] w-[52px] rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 overflow-hidden">
        {crew.bannerImage ? (
          <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
        ) : (
          <Users className="h-6 w-6 text-primary-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-semibold text-gray-900 truncate text-sm">{crew.name}</h3>
          {crew.visibility === 'PASSWORD' && <Lock className="h-3 w-3 text-gray-400 shrink-0" />}
        </div>
        {crew.description && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-1.5">{crew.description}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">{crew._count.members}/{crew.maxMembers}명</span>
          <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
            {CATEGORY_LABELS[crew.category] ?? crew.category}
          </span>
        </div>
      </div>
    </div>
  );

  if (isMine) return <Link href={`/crews/${crew.id}`} className={cardBase}>{content}</Link>;
  return <button onClick={() => onJoinClick(crew)} className={cardBase}>{content}</button>;
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

  const handleJoinClick = (crew: Crew) => {
    if (myCrewIds.has(crew.id)) return;
    setJoiningCrew(crew);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">크루</h1>
          <Link href="/crews/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              크루 만들기
            </Button>
          </Link>
        </div>

        {/* My Crews */}
        {myCrews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">내 크루</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myCrews.map((crew) => (
                <CrewCard key={crew.id} crew={crew} onJoinClick={handleJoinClick} isMine={true} />
              ))}
            </div>
          </section>
        )}

        {/* Explore */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">크루 탐색</h2>

          {/* Search bar */}
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
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                !selectedCategory
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300',
              )}
            >
              전체
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  selectedCategory === c
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                )}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publicCrews?.map((crew) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                onJoinClick={handleJoinClick}
                isMine={myCrewIds.has(crew.id)}
              />
            ))}
            {publicCrews?.length === 0 && (
              <p className="col-span-2 py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      {joiningCrew && (
        <JoinModal crew={joiningCrew} onClose={() => setJoiningCrew(null)} />
      )}
    </div>
  );
}
