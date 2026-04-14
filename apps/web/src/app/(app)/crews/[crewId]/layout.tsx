'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Hash, ArrowLeft, ChevronDown, ChevronRight, Play, Pause, Square, Timer } from 'lucide-react';
import { cn, formatSeconds, resolveUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';

interface Channel { id: string; name: string; type: string }
interface Crew { id: string; name: string; emoji: string; bannerImage?: string; description?: string }
interface MemberStat { userId: string; nickname: string; profileImage?: string; role: string; done: number; total: number; pct: number }
interface PomoState { sessionId: string; startedById: string; workMinutes: number; breakMinutes: number; status: 'RUNNING' | 'PAUSED' | 'BREAK'; endsAt: number; remainingMs?: number }

function CrewPomoPanel({ crewId }: { crewId: string }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [pomoState, setPomoState] = useState<PomoState | null>(null);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoWork, setPomoWork] = useState(25);
  const [pomoBreak, setPomoBreak] = useState(5);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('pomo:join', { crewId });
    socket.on('pomo:state', (s: PomoState | null) => {
      setPomoState(s);
      if (s?.status === 'RUNNING') setPomoSeconds(Math.max(0, Math.floor((s.endsAt - Date.now()) / 1000)));
      else if (s?.status === 'PAUSED') setPomoSeconds(Math.max(0, Math.floor((s.remainingMs ?? 0) / 1000)));
    });
    return () => { socket.off('pomo:state'); };
  }, [crewId, accessToken]);

  useEffect(() => {
    if (!pomoState || pomoState.status !== 'RUNNING') return;
    const id = setInterval(() => setPomoSeconds(Math.max(0, Math.floor((pomoState.endsAt - Date.now()) / 1000))), 500);
    return () => clearInterval(id);
  }, [pomoState]);

  const emitPomo = (event: string, payload: any) => {
    if (!accessToken) return;
    getSocket(accessToken).emit(event, payload);
  };

  const isStarter = user?.id === pomoState?.startedById;
  const total = (pomoState?.workMinutes ?? pomoWork) * 60;
  const pct = pomoState ? ((total - pomoSeconds) / total) * 100 : 0;
  const cir = 2 * Math.PI * 22;

  return (
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center gap-1.5 mb-3">
        <Timer className="h-3.5 w-3.5 text-primary-500" />
        <span className="text-xs font-semibold text-gray-700">크루 포모도로</span>
      </div>

      {!pomoState ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="font-bold text-lg text-gray-300">{formatSeconds(pomoWork * 60)}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400">집중</span>
              <input type="number" min={1} max={90} value={pomoWork}
                onChange={(e) => setPomoWork(+e.target.value)}
                className="input-field w-12 text-center text-xs py-1" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400">휴식</span>
              <input type="number" min={1} max={30} value={pomoBreak}
                onChange={(e) => setPomoBreak(+e.target.value)}
                className="input-field w-12 text-center text-xs py-1" />
            </div>
          </div>
          <button
            onClick={() => emitPomo('pomo:start', { crewId, workMinutes: pomoWork, breakMinutes: pomoBreak })}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors"
          >
            <Play className="h-3 w-3" /> 시작
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <svg width="52" height="52" className="-rotate-90">
              <circle cx="26" cy="26" r="22" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none"
                stroke={pomoState.status === 'PAUSED' ? '#f59e0b' : '#7c6ff7'}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={cir} strokeDashoffset={cir - (pct / 100) * cir}
                className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold tabular-nums text-gray-700">{formatSeconds(pomoSeconds)}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1.5">
              {pomoState.status === 'RUNNING' ? '집중 세션 중' : '일시정지'}
            </p>
            {isStarter ? (
              <div className="flex gap-1.5">
                {pomoState.status === 'RUNNING' ? (
                  <button onClick={() => emitPomo('pomo:pause', { crewId })}
                    className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-medium hover:bg-amber-200">
                    <Pause className="h-3 w-3 inline" /> 정지
                  </button>
                ) : (
                  <button onClick={() => emitPomo('pomo:resume', { crewId })}
                    className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-[10px] font-medium hover:bg-primary-200">
                    <Play className="h-3 w-3 inline" /> 재개
                  </button>
                )}
                <button onClick={() => { if (confirm('종료?')) emitPomo('pomo:end', { crewId }); }}
                  className="px-2 py-1 bg-red-50 text-red-500 rounded text-[10px] font-medium hover:bg-red-100">
                  <Square className="h-3 w-3 inline" /> 종료
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">시작자만 제어 가능</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { crewId: string };
}) {
  const { crewId } = params;
  const pathname = usePathname();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);

  const { data: crew } = useQuery<Crew>({
    queryKey: ['crew', crewId],
    queryFn: () => api.get(`/crews/${crewId}`).then((r) => r.data),
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels', crewId],
    queryFn: () => api.get(`/crews/${crewId}/channels`).then((r) => r.data),
  });

  const { data: stats = [] } = useQuery<MemberStat[]>({
    queryKey: ['crew-today-stats', crewId],
    queryFn: () => api.get(`/crews/${crewId}/today-stats`).then((r) => r.data),
    refetchInterval: 30000,
  });

  const firstChannelId = channels[0]?.id;

  const TABS = [
    { label: '채팅', href: firstChannelId ? `/crews/${crewId}/channels/${firstChannelId}` : `/crews/${crewId}`, match: '/channels/' },
    { label: '게시판', href: `/crews/${crewId}/board`, match: '/board' },
    { label: '멤버', href: `/crews/${crewId}/members`, match: '/members' },
  ];

  const activeTab = TABS.find((t) => pathname.includes(t.match))?.label ?? '채팅';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 border-r border-gray-100 bg-white shrink-0 overflow-y-auto scrollbar-thin">
        {/* Crew header */}
        <div className="p-3 border-b border-gray-100">
          <Link href="/crews" className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 mb-2 transition-colors">
            <ArrowLeft className="h-3 w-3" /> 크루 목록
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
              {crew?.bannerImage
                ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-primary-600">{crew?.name?.charAt(0) ?? '?'}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{crew?.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {/* Channels section */}
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600"
          >
            <span>채널</span>
            {channelsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {channelsOpen && channels.map((ch) => (
            <Link key={ch.id} href={`/crews/${crewId}/channels/${ch.id}`}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
                pathname.includes(ch.id) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <Hash className="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="truncate">{ch.name}</span>
            </Link>
          ))}

          {/* Member progress */}
          {stats.length > 0 && (
            <div className="pt-2 mt-1 border-t border-gray-100">
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-gray-600"
              >
                <span>오늘 달성률</span>
                {membersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {membersOpen && (
                <div className="mt-1 space-y-2 px-1">
                  {stats.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <Avatar src={m.profileImage} fallback={m.nickname} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-gray-600 truncate">{m.nickname}</span>
                          <span className={cn('text-[11px] font-semibold shrink-0 ml-1', m.pct === 100 ? 'text-green-500' : 'text-primary-500')}>
                            {m.total === 0 ? '-' : `${m.pct}%`}
                          </span>
                        </div>
                        {m.total > 0 && (
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', m.pct === 100 ? 'bg-green-400' : 'bg-primary-400')}
                              style={{ width: `${m.pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100">
          <Link href="/crews" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-500 transition-colors">
            <span>+ 다른 크루 찾기</span>
          </Link>
        </div>
      </aside>

      {/* ── Center: tab bar + content ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-gray-100 bg-white px-4 shrink-0">
          {TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.label
                  ? 'text-primary-600 border-primary-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Page content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>

          {/* ── Right panel ── */}
          <div className="hidden lg:flex flex-col w-64 border-l border-gray-100 bg-white shrink-0 overflow-y-auto scrollbar-thin">
            <CrewPomoPanel crewId={crewId} />

            {/* Latest post activity */}
            <div className="p-3">
              <p className="text-[11px] font-semibold text-gray-400 mb-2">게시판 활동</p>
              <LatestPostPanel crewId={crewId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatestPostPanel({ crewId }: { crewId: string }) {
  const { data } = useQuery({
    queryKey: ['posts-latest', crewId],
    queryFn: () => api.get(`/crews/${crewId}/posts`).then((r) => {
      const items = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
      return items.slice(0, 3);
    }).catch(() => []),
    refetchInterval: 15000,
  });

  if (!data?.length) {
    return <p className="text-xs text-gray-400">아직 게시글이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((post: any) => (
        <Link key={post.id} href={`/crews/${crewId}/board`}
          className="block p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Avatar src={post.user?.profileImage} fallback={post.user?.nickname ?? '?'} size="xs" />
            <span className="text-[11px] font-medium text-gray-700 truncate">{post.user?.nickname}</span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400">👍 {post._count?.reactions ?? 0}</span>
            <span className="text-[10px] text-gray-400">💬 {post._count?.comments ?? 0}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
