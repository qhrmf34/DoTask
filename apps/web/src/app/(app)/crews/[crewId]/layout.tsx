'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hash, ArrowLeft, ChevronDown, ChevronRight, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { cn, formatSeconds, resolveUrl } from '@/lib/utils';
import { useDialog } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';

interface LastMessage { content: string; type: string; createdAt: string; user: { nickname: string } }
interface Channel { id: string; name: string; type: string; lastMessage?: LastMessage | null }
interface Crew { id: string; name: string; emoji: string; bannerImage?: string; description?: string }
interface MemberStat { userId: string; nickname: string; profileImage?: string; role: string; done: number; total: number; pct: number }
interface PomoState { sessionId: string; startedById: string; workMinutes: number; breakMinutes: number; status: 'RUNNING' | 'PAUSED' | 'BREAK'; endsAt: number; remainingMs?: number }

function CrewPomoPanel({ crewId }: { crewId: string }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { confirm } = useDialog();
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
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.floor((pomoState.endsAt - Date.now()) / 1000));
      setPomoSeconds(remaining);
      // 타이머 자연 만료 감지 — 서버는 Redis 삭제만 하고 이벤트를 안 보내므로 프론트에서 처리
      if (remaining === 0) setPomoState(null);
    }, 500);
    return () => clearInterval(id);
  }, [pomoState]);

  const emitPomo = (event: string, payload: any) => {
    if (!accessToken) return;
    getSocket(accessToken).emit(event, payload);
  };

  const handleEnd = async () => {
    const ok = await confirm({ title: '세션 종료', message: '진행 중인 포모도로를 종료할까요?', confirmText: '종료', cancelText: '취소', type: 'danger' });
    if (!ok) return;
    // 낙관적 업데이트: 서버 응답 기다리지 않고 즉시 UI 초기화
    setPomoState(null);
    emitPomo('pomo:end', { crewId });
  };

  const isStarter = user?.id === pomoState?.startedById;
  const isRunning = pomoState?.status === 'RUNNING';
  const isPaused = pomoState?.status === 'PAUSED';
  const total = (pomoState?.workMinutes ?? pomoWork) * 60;
  const pct = pomoState ? ((total - pomoSeconds) / total) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const stroke = isPaused ? '#f59e0b' : '#7c6ff7';

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700">크루 포모도로</span>
        {pomoState && isStarter && (
          <button onClick={handleEnd} className="h-6 w-6 rounded flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Square className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!pomoState ? (
        <div className="flex flex-col items-center py-1 gap-3">
          {/* 원형 + 시간 표시 (비활성) */}
          <div className="relative">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold tabular-nums text-gray-300">{formatSeconds(pomoWork * 60)}</span>
            </div>
          </div>
          {/* 시간 설정 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400">집중</span>
              <input type="number" min={1} max={90} value={pomoWork}
                onChange={(e) => setPomoWork(+e.target.value)}
                className="input-field w-14 text-center text-xs py-1" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400">휴식</span>
              <input type="number" min={1} max={30} value={pomoBreak}
                onChange={(e) => setPomoBreak(+e.target.value)}
                className="input-field w-14 text-center text-xs py-1" />
            </div>
          </div>
          <button
            onClick={() => emitPomo('pomo:start', { crewId, workMinutes: pomoWork, breakMinutes: pomoBreak })}
            className="h-10 w-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-sm transition-colors"
          >
            <Play className="h-4 w-4 ml-0.5" />
          </button>
          <p className="text-xs text-gray-400">{pomoWork}분 집중 · {pomoBreak}분 휴식</p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-1 gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPaused ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
              {isPaused ? '일시정지' : '집중 중'} · {pomoState.workMinutes}분
            </span>
          </div>
          {/* 원형 타이머 */}
          <div className="relative">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" fill="none"
                stroke={stroke} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold tabular-nums ${isPaused ? 'text-amber-500' : 'text-primary-600'}`}>
                {formatSeconds(pomoSeconds)}
              </span>
            </div>
          </div>
          {/* 컨트롤 */}
          {isStarter ? (
            <div className="flex items-center gap-3">
              <button onClick={() => emitPomo('pomo:end', { crewId })}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => isRunning ? emitPomo('pomo:pause', { crewId }) : emitPomo('pomo:resume', { crewId })}
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-colors text-white ${isPaused ? 'bg-amber-400 hover:bg-amber-500' : 'bg-primary-500 hover:bg-primary-600'}`}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">시작자만 제어 가능</p>
          )}
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
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
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

  // 새 메시지가 오면 해당 채널의 lastMessage 실시간 업데이트
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNewMsg = (msg: any) => {
      if (!msg?.channelId) return;
      qc.setQueryData(['channels', crewId], (old: Channel[] | undefined) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === msg.channelId
            ? { ...ch, lastMessage: { content: msg.content, type: msg.type, createdAt: msg.createdAt, user: msg.user } }
            : ch,
        );
      });
    };

    socket.on('chat:message', handleNewMsg);
    return () => { socket.off('chat:message', handleNewMsg); };
  }, [crewId, accessToken, qc]);

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
          <Link href="/crews" className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 mb-3 transition-colors">
            <ArrowLeft className="h-3 w-3" /> 크루 목록
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
              {crew?.bannerImage
                ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-primary-600">{crew?.name?.charAt(0) ?? '?'}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{crew?.name}</p>
              {crew?.description && (
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{crew.description}</p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {/* Channels section */}
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wide"
          >
            <span>채널</span>
            {channelsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {channelsOpen && channels.map((ch) => {
            const active = pathname.includes(ch.id);
            const last = ch.lastMessage;
            const preview = last
              ? last.type === 'IMAGE' ? '📷 사진'
              : last.type === 'FILE' ? '📎 파일'
              : last.content.slice(0, 26)
              : null;

            return (
              <Link key={ch.id} href={`/crews/${crewId}/channels/${ch.id}`}
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-xl transition-colors',
                  active ? 'bg-primary-50' : 'hover:bg-gray-50',
                )}
              >
                <Hash className={cn('h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60', active && 'text-primary-500')} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm truncate leading-snug', active ? 'text-primary-700 font-semibold' : 'text-gray-600 font-medium')}>
                    {ch.name}
                  </p>
                  {preview && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-snug">
                      <span className="font-semibold text-gray-500">{last!.user.nickname}</span>: {preview}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Member progress */}
          {stats.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wide"
              >
                <span>오늘 달성률</span>
                {membersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {membersOpen && (
                <div className="mt-1.5 space-y-2.5 px-1">
                  {stats.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <Avatar src={m.profileImage} fallback={m.nickname} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-gray-600 truncate font-medium">{m.nickname}</span>
                          <span className={cn('text-[11px] font-bold shrink-0 ml-1', m.pct === 100 ? 'text-green-500' : 'text-primary-500')}>
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
          <Link href="/crews" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-500 transition-colors font-medium">
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

            {/* Recent chat */}
            <div className="p-3 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5 px-1">최근 채팅</p>
              <RecentChatPanel channels={channels} crewId={crewId} />
            </div>

            {/* Latest post activity */}
            <div className="p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5 px-1">게시판 활동</p>
              <LatestPostPanel crewId={crewId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentChatPanel({ channels, crewId }: { channels: Channel[]; crewId: string }) {
  // lastMessage가 있는 채널만, createdAt 내림차순으로 최대 4개
  const recent = [...channels]
    .filter((ch) => ch.lastMessage)
    .sort((a, b) => new Date(b.lastMessage!.createdAt).getTime() - new Date(a.lastMessage!.createdAt).getTime())
    .slice(0, 4);

  if (!recent.length) return <p className="text-xs text-gray-400 px-1">아직 대화가 없습니다.</p>;

  return (
    <div className="space-y-1.5">
      {recent.map((ch) => {
        const last = ch.lastMessage!;
        const preview = last.type === 'IMAGE' ? '사진을 보냈습니다'
          : last.type === 'FILE' ? '파일을 보냈습니다'
          : last.content;
        return (
          <Link key={ch.id} href={`/crews/${crewId}/channels/${ch.id}`}
            className="flex items-start gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="h-6 w-6 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
              <Hash className="h-3 w-3 text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-600 truncate">{last.user.nickname}</span>
                <span className="text-[10px] text-gray-300 shrink-0">#{ch.name}</span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{preview}</p>
            </div>
          </Link>
        );
      })}
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
    return <p className="text-xs text-gray-400 px-1">아직 게시글이 없습니다.</p>;
  }

  return (
    <div className="space-y-1.5">
      {data.map((post: any) => (
        <Link key={post.id} href={`/crews/${crewId}/board`}
          className="block p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar src={post.user?.profileImage} fallback={post.user?.nickname ?? '?'} size="xs" />
            <span className="text-[11px] font-semibold text-gray-700 truncate">{post.user?.nickname}</span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="text-[10px] text-gray-400">👍 {post._count?.reactions ?? 0}</span>
            <span className="text-[10px] text-gray-400">💬 {post._count?.comments ?? 0}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
