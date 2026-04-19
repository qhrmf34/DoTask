'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Hash, ArrowLeft, ChevronDown, ChevronRight, Play, Pause, Square, RotateCcw, MessageCircle, LayoutList, Users, Timer, X, Menu } from 'lucide-react';
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

function CrewPomoPanel({ crewId, hideTitle }: { crewId: string; hideTitle?: boolean }) {
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
  const stroke = isPaused ? '#f59e0b' : '#8b5cf6';

  return (
    <div className="p-4" style={{ borderBottom: '1px solid #e8e4f8' }}>
      {!hideTitle && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>크루 포모도로</span>
          {pomoState && isStarter && (
            <button onClick={handleEnd}
              className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
              <Square className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {hideTitle && pomoState && isStarter && (
        <div className="flex justify-end mb-3">
          <button onClick={handleEnd}
            className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Square className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!pomoState ? (
        <div className="flex flex-col items-center py-1 gap-3">
          <div className="relative">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#ede9fe" strokeWidth="6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold tabular-nums text-primary-200">{formatSeconds(pomoWork * 60)}</span>
            </div>
          </div>
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
            <span className={cn(
              'text-xs font-semibold px-2.5 py-0.5 rounded-full',
              isPaused ? 'bg-amber-50 text-amber-600' : 'bg-primary-100 text-primary-600',
            )}>
              {isPaused ? '일시정지' : '집중 중'} · {pomoState.workMinutes}분
            </span>
          </div>
          <div className="relative">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#ede9fe" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" fill="none"
                stroke={stroke} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-xl font-bold tabular-nums', isPaused ? 'text-amber-500' : 'text-primary-600')}>
                {formatSeconds(pomoSeconds)}
              </span>
            </div>
          </div>
          {isStarter ? (
            <div className="flex items-center gap-3">
              <button onClick={() => emitPomo('pomo:end', { crewId })}
                className="h-8 w-8 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-primary-50 flex items-center justify-center transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => isRunning ? emitPomo('pomo:pause', { crewId }) : emitPomo('pomo:resume', { crewId })}
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-colors text-white',
                  isPaused ? 'bg-amber-400 hover:bg-amber-500' : 'bg-primary-500 hover:bg-primary-600',
                )}
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
  const [mobileChannelOpen, setMobileChannelOpen] = useState(false);
  const [mobileTimerOpen, setMobileTimerOpen] = useState(false);

  const { data: crew } = useQuery<Crew>({
    queryKey: ['crew', crewId],
    queryFn: () => api.get(`/crews/${crewId}`).then((r) => r.data),
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels', crewId],
    queryFn: () => api.get(`/crews/${crewId}/channels`).then((r) => r.data),
  });

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
    { label: '채팅', icon: MessageCircle, href: firstChannelId ? `/crews/${crewId}/channels/${firstChannelId}` : `/crews/${crewId}`, match: '/channels/' },
    { label: '게시판', icon: LayoutList, href: `/crews/${crewId}/board`, match: '/board' },
    { label: '멤버', icon: Users, href: `/crews/${crewId}/members`, match: '/members' },
  ];

  const activeTab = TABS.find((t) => pathname.includes(t.match))?.label ?? '채팅';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0 overflow-y-auto scrollbar-thin"
        style={{
          background: 'linear-gradient(180deg, #f3f2fe 0%, #f7f8fa 100%)',
          borderRight: '1px solid #e8e4f8',
        }}
      >
        {/* Crew header */}
        <div className="p-3" style={{ borderBottom: '1px solid #e8e4f8' }}>
          <Link
            href="/crews"
            className="flex items-center gap-1.5 text-[11px] text-primary-400 hover:text-primary-600 mb-3 transition-colors font-semibold"
          >
            <ArrowLeft className="h-3 w-3" /> 크루 목록
          </Link>

          {/* Crew identity */}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden"
              style={{ border: '1.5px solid #ddd6fe' }}>
              {crew?.bannerImage
                ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
                : <span className="text-sm font-extrabold text-primary-600">{crew?.name?.charAt(0) ?? '?'}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate" style={{ color: '#4c1d95' }}>{crew?.name}</p>
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
            className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-bold text-primary-400 hover:text-primary-600 uppercase tracking-wider"
          >
            <span>채널</span>
            {channelsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {channelsOpen && channels.map((ch) => {
            const active = pathname.includes(ch.id);
            const last = ch.lastMessage;
            const preview = last
              ? last.type === 'IMAGE' ? '이미지를 보냈습니다'
              : last.type === 'FILE' ? '파일을 보냈습니다'
              : last.content.slice(0, 24)
              : null;

            return (
              <Link
                key={ch.id}
                href={`/crews/${crewId}/channels/${ch.id}`}
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-2xl transition-all',
                  active
                    ? 'bg-primary-100 shadow-sm'
                    : 'hover:bg-primary-50',
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  active ? 'bg-primary-200' : 'bg-primary-50',
                )}>
                  <Hash className={cn('h-3 w-3', active ? 'text-primary-600' : 'text-primary-400')} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm truncate leading-snug',
                    active ? 'text-primary-700 font-bold' : 'text-gray-600 font-medium',
                  )}>
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
            <div className="pt-2 mt-2" style={{ borderTop: '1px solid #e8e4f8' }}>
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-bold text-primary-400 hover:text-primary-600 uppercase tracking-wider"
              >
                <span>오늘 달성률</span>
                {membersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {membersOpen && (
                <div className="mt-2 space-y-3 px-1">
                  {stats.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <Avatar src={m.profileImage} fallback={m.nickname} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-gray-600 truncate font-semibold">{m.nickname}</span>
                          <span className={cn('text-[11px] font-bold shrink-0 ml-1', m.pct === 100 ? 'text-mint-500' : 'text-primary-500')}>
                            {m.total === 0 ? '-' : `${m.pct}%`}
                          </span>
                        </div>
                        {m.total > 0 && (
                          <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', m.pct === 100 ? 'bg-mint-400' : 'progress-shimmer')}
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
        <div className="p-3" style={{ borderTop: '1px solid #e8e4f8' }}>
          <Link
            href="/crews"
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-600 transition-colors font-semibold"
          >
            <span>+ 다른 크루 찾기</span>
          </Link>
        </div>
      </aside>

      {/* ── Mobile: Channel Drawer ── */}
      {mobileChannelOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileChannelOpen(false)} />
          <div
            className="relative w-72 h-full flex flex-col overflow-y-auto scrollbar-thin"
            style={{ background: 'linear-gradient(180deg,#f3f2fe 0%,#f7f8fa 100%)', borderRight: '1px solid #e8e4f8' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #e8e4f8' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shrink-0" style={{ border: '1.5px solid #ddd6fe' }}>
                  {crew?.bannerImage
                    ? <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-extrabold text-primary-600">{crew?.name?.charAt(0) ?? '?'}</span>
                  }
                </div>
                <p className="font-extrabold text-sm" style={{ color: '#4c1d95' }}>{crew?.name}</p>
              </div>
              <button onClick={() => setMobileChannelOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channel list */}
            <nav className="flex-1 p-3 space-y-0.5">
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider px-2 py-1.5">채널</p>
              {channels.map((ch) => {
                const active = pathname.includes(ch.id);
                const last = ch.lastMessage;
                const preview = last
                  ? last.type === 'IMAGE' ? '이미지를 보냈습니다'
                  : last.type === 'FILE' ? '파일을 보냈습니다'
                  : last.content.slice(0, 24)
                  : null;
                return (
                  <Link
                    key={ch.id}
                    href={`/crews/${crewId}/channels/${ch.id}`}
                    onClick={() => setMobileChannelOpen(false)}
                    className={cn(
                      'flex items-start gap-2.5 px-2.5 py-2.5 rounded-2xl transition-all',
                      active ? 'bg-primary-100 shadow-sm' : 'hover:bg-primary-50',
                    )}
                  >
                    <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5', active ? 'bg-primary-200' : 'bg-primary-50')}>
                      <Hash className={cn('h-3.5 w-3.5', active ? 'text-primary-600' : 'text-primary-400')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm truncate', active ? 'text-primary-700 font-bold' : 'text-gray-600 font-medium')}>{ch.name}</p>
                      {preview && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          <span className="font-semibold text-gray-500">{last!.user.nickname}</span>: {preview}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Member stats */}
              {stats.length > 0 && (
                <div className="pt-3 mt-2" style={{ borderTop: '1px solid #e8e4f8' }}>
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider px-2 py-1.5">오늘 달성률</p>
                  <div className="space-y-3 px-2 mt-1">
                    {stats.map((m) => (
                      <div key={m.userId} className="flex items-center gap-2">
                        <Avatar src={m.profileImage} fallback={m.nickname} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-gray-600 truncate font-semibold">{m.nickname}</span>
                            <span className={cn('text-[11px] font-bold shrink-0 ml-1', m.pct === 100 ? 'text-mint-500' : 'text-primary-500')}>
                              {m.total === 0 ? '-' : `${m.pct}%`}
                            </span>
                          </div>
                          {m.total > 0 && (
                            <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', m.pct === 100 ? 'bg-mint-400' : 'progress-shimmer')}
                                style={{ width: `${m.pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* ── Mobile: Timer Bottom Sheet ── */}
      {mobileTimerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileTimerOpen(false)} />
          <div
            className="relative w-full rounded-t-3xl overflow-hidden"
            style={{ background: 'white', border: '1px solid #e8e4f8' }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-sm font-bold" style={{ color: '#7c3aed' }}>크루 포모도로</span>
              <button onClick={() => setMobileTimerOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <CrewPomoPanel crewId={crewId} hideTitle />
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* ── Center: tab bar + content ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-2 px-3 py-2 shrink-0"
          style={{ background: 'white', borderBottom: '1px solid #e8e4f8' }}
        >
          <button
            onClick={() => setMobileChannelOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-primary-600 bg-primary-50 text-xs font-semibold"
          >
            <Menu className="h-3.5 w-3.5" />
            채널
          </button>
          <div className="flex-1 min-w-0 text-center">
            {(() => {
              const activeChannel = channels.find((ch) => pathname.includes(ch.id));
              return activeChannel ? (
                <span className="text-xs font-bold text-gray-700 truncate">
                  # {activeChannel.name}
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-500">{crew?.name}</span>
              );
            })()}
          </div>
          <button
            onClick={() => setMobileTimerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-primary-600 bg-primary-50 text-xs font-semibold"
          >
            <Timer className="h-3.5 w-3.5" />
            타이머
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center px-4 shrink-0"
          style={{ background: 'white', borderBottom: '1px solid #e8e4f8' }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.label;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2',
                  active
                    ? 'text-primary-600 border-primary-500'
                    : 'text-gray-400 border-transparent hover:text-primary-500 hover:border-primary-200',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>

          {/* ── Right panel ── */}
          <div
            className="hidden lg:flex flex-col w-64 shrink-0 overflow-y-auto scrollbar-thin"
            style={{ background: 'white', borderLeft: '1.5px solid #e8e4f8' }}
          >
            <CrewPomoPanel crewId={crewId} />

            {/* Recent chat */}
            <div className="px-4 py-3" style={{ borderBottom: '1.5px solid #f0eeff' }}>
              <p className="text-[11px] font-extrabold mb-3 tracking-wide" style={{ color: '#7c3aed' }}>최근 채팅</p>
              <RecentChatPanel channels={channels} crewId={crewId} />
            </div>

            {/* Latest post activity */}
            <div className="px-4 py-3">
              <p className="text-[11px] font-extrabold mb-3 tracking-wide" style={{ color: '#7c3aed' }}>게시판 활동</p>
              <LatestPostPanel crewId={crewId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentChatPanel({ channels, crewId }: { channels: Channel[]; crewId: string }) {
  const recent = [...channels]
    .filter((ch) => ch.lastMessage)
    .sort((a, b) => new Date(b.lastMessage!.createdAt).getTime() - new Date(a.lastMessage!.createdAt).getTime())
    .slice(0, 4);

  if (!recent.length) return <p className="text-xs text-gray-400">아직 대화가 없습니다.</p>;

  return (
    <div className="space-y-1">
      {recent.map((ch) => {
        const last = ch.lastMessage!;
        const preview = last.type === 'IMAGE' ? '🖼 이미지'
          : last.type === 'FILE' ? '📎 파일'
          : last.content;
        return (
          <Link key={ch.id} href={`/crews/${crewId}/channels/${ch.id}`}
            className="flex items-start gap-2.5 px-2.5 py-2 rounded-2xl hover:bg-primary-50 transition-colors group"
          >
            <div className="h-7 w-7 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary-200 transition-colors">
              <Hash className="h-3.5 w-3.5 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-gray-700 truncate">{last.user.nickname}</span>
                <span className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-400">#{ch.name}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{preview}</p>
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
    return <p className="text-xs text-gray-400">아직 게시글이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((post: any) => (
        <Link key={post.id} href={`/crews/${crewId}/board`}
          className="block px-3 py-2.5 rounded-2xl hover:bg-primary-50 transition-colors"
          style={{ border: '1.5px solid #ede9fe' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar src={post.user?.profileImage} fallback={post.user?.nickname ?? '?'} size="xs" />
            <span className="text-xs font-bold text-gray-800 truncate">{post.user?.nickname}</span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="text-[10px] font-bold text-primary-500">👍 {post._count?.reactions ?? 0}</span>
            <span className="text-[10px] text-gray-400 font-medium">💬 {post._count?.comments ?? 0}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
