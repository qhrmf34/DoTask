'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Users } from 'lucide-react';
import { cn, formatSeconds } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface PomoState {
  sessionId: string;
  startedById: string;
  workMinutes: number;
  breakMinutes: number;
  status: 'RUNNING' | 'PAUSED' | 'BREAK';
  endsAt: number;
  remainingMs?: number;
}

export default function CrewPomodoroPage({ params }: { params: { crewId: string } }) {
  const { crewId } = params;
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [state, setState] = useState<PomoState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  useEffect(() => {
    if (accessToken) return;
    api.post('/auth/refresh')
      .then((res) => {
        if (res.data?.accessToken) setAccessToken(res.data.accessToken);
      })
      .catch(() => {});
  }, [accessToken, setAccessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.emit('pomo:join', { crewId });
    socket.on('pomo:state', (s: PomoState | null) => {
      setState(s);
      if (s && s.status === 'RUNNING') {
        setSecondsLeft(Math.max(0, Math.floor((s.endsAt - Date.now()) / 1000)));
      } else if (s && s.status === 'PAUSED') {
        setSecondsLeft(Math.max(0, Math.floor((s.remainingMs ?? 0) / 1000)));
      }
    });
    socket.on('pomo:error', (e: { message?: string }) => {
      if (e?.message) alert(e.message);
    });
    return () => {
      socket.off('pomo:state');
      socket.off('pomo:error');
    };
  }, [crewId, accessToken]);

  // Countdown
  useEffect(() => {
    if (!state || state.status !== 'RUNNING') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((state.endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
    }, 500);
    return () => clearInterval(id);
  }, [state]);

  const isStarter = user?.id === state?.startedById;
  const emitPomo = (event: string, payload: any) => {
    if (!accessToken) return;
    getSocket(accessToken).emit(event, payload);
  };

  const totalSeconds = (state?.workMinutes ?? workMinutes) * 60;
  const progress = state ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 64;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center gap-8">
        <h2 className="text-lg font-bold text-gray-900">크루 포모도로</h2>

        {/* Timer */}
        <div className="relative">
          <svg width="160" height="160" className="-rotate-90">
            <circle cx="80" cy="80" r="64" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {state && (
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="none"
                stroke={state.status === 'PAUSED' ? '#f59e0b' : '#7c6ff7'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-gray-900">
              {state ? formatSeconds(secondsLeft) : formatSeconds(workMinutes * 60)}
            </span>
            {state && (
              <span className="text-xs text-gray-400 mt-1">
                {state.status === 'RUNNING' ? '집중 중' : '일시정지'}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        {!state ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-1">
                <label className="text-xs text-gray-400">집중 (분)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(+e.target.value)}
                  className="input-field w-20 text-center"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <label className="text-xs text-gray-400">휴식 (분)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(+e.target.value)}
                  className="input-field w-20 text-center"
                />
              </div>
            </div>
            <Button onClick={() => emitPomo('pomo:start', { crewId, workMinutes, breakMinutes })}>
              <Play className="h-4 w-4" /> 시작하기
            </Button>
            <p className="text-xs text-gray-400">시작하면 모든 크루원에게 공유됩니다</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {isStarter && state.status === 'RUNNING' && (
              <Button variant="secondary" onClick={() => emitPomo('pomo:pause', { crewId })}>
                <Pause className="h-4 w-4" /> 일시정지
              </Button>
            )}
            {isStarter && state.status === 'PAUSED' && (
              <Button onClick={() => emitPomo('pomo:resume', { crewId })}>
                <Play className="h-4 w-4" /> 재개
              </Button>
            )}
            {isStarter && (
              <Button variant="danger" onClick={() => {
                if (confirm('세션을 종료할까요?')) emitPomo('pomo:end', { crewId });
              }}>
                <Square className="h-4 w-4" /> 종료
              </Button>
            )}
            {!isStarter && (
              <p className="text-sm text-gray-500">세션 시작자만 제어할 수 있습니다</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
