'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Settings, X } from 'lucide-react';
import { cn, formatSeconds } from '@/lib/utils';
import { usePomodoroStore } from '@/store/pomodoro.store';
import api from '@/lib/api';

const phaseLabel = { work: '집중', short_break: '짧은 휴식', long_break: '긴 휴식' };
const phaseColor = { work: 'text-primary-600', short_break: 'text-green-600', long_break: 'text-blue-600' };
const phaseBorder = { work: 'border-primary-200', short_break: 'border-green-200', long_break: 'border-blue-200' };
const phaseStroke = { work: '#7c6ff7', short_break: '#22c55e', long_break: '#3b82f6' };

export function PomodoroTimer() {
  const qc = useQueryClient();
  const {
    phase, round, secondsLeft, isRunning,
    workMinutes, shortBreakMinutes, longBreakMinutes, longBreakInterval,
    autoStartBreak, autoStartWork,
    start, pause, reset, setSettings,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreak: false,
    autoStartWork: false,
    soundEnabled: true,
  });

  // Load settings from DB
  const { data: settings } = useQuery({
    queryKey: ['pomodoro-settings'],
    queryFn: () => api.get('/pomodoro-settings').then((r) => r.data).catch(() => null),
  });

  useEffect(() => {
    if (settings) {
      const s = {
        workMinutes: settings.workMinutes,
        shortBreakMinutes: settings.shortBreakMinutes,
        longBreakMinutes: settings.longBreakMinutes,
        longBreakInterval: settings.longBreakInterval,
        autoStartBreak: settings.autoStartBreak,
        autoStartWork: settings.autoStartWork,
        soundEnabled: settings.soundEnabled,
      };
      setSettings(s);
      setDraft(s);
    }
  }, [settings, setSettings]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof draft) => api.patch('/pomodoro-settings', data),
    onSuccess: () => {
      setSettings(draft);
      qc.invalidateQueries({ queryKey: ['pomodoro-settings'] });
      setShowSettings(false);
    },
  });

  const totalSeconds =
    phase === 'work' ? workMinutes * 60
    : phase === 'short_break' ? shortBreakMinutes * 60
    : longBreakMinutes * 60;

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const openSettings = () => {
    setDraft({ workMinutes, shortBreakMinutes, longBreakMinutes, longBreakInterval, autoStartBreak, autoStartWork, soundEnabled: true });
    setShowSettings(true);
  };

  if (showSettings) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">타이머 설정</h3>
          <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">집중 시간 (분)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={draft.workMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, workMinutes: +e.target.value }))}
                className="input-field text-sm py-1.5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">짧은 휴식 (분)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={draft.shortBreakMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, shortBreakMinutes: +e.target.value }))}
                className="input-field text-sm py-1.5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">긴 휴식 (분)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={draft.longBreakMinutes}
                onChange={(e) => setDraft((d) => ({ ...d, longBreakMinutes: +e.target.value }))}
                className="input-field text-sm py-1.5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">긴 휴식 주기</label>
              <input
                type="number"
                min={2}
                max={10}
                value={draft.longBreakInterval}
                onChange={(e) => setDraft((d) => ({ ...d, longBreakInterval: +e.target.value }))}
                className="input-field text-sm py-1.5"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.autoStartBreak}
                onChange={(e) => setDraft((d) => ({ ...d, autoStartBreak: e.target.checked }))}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-xs text-gray-600">휴식 자동 시작</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.autoStartWork}
                onChange={(e) => setDraft((d) => ({ ...d, autoStartWork: e.target.checked }))}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
              />
              <span className="text-xs text-gray-600">집중 자동 시작</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => saveMutation.mutate(draft)}
            disabled={saveMutation.isPending}
            className="flex-1 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card p-4 border', phaseBorder[phase])}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">포모도로</h3>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50', phaseColor[phase])}>
            {phaseLabel[phase]} · {round}R
          </span>
        </div>
        <button
          onClick={openSettings}
          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="설정"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Circular timer */}
      <div className="flex flex-col items-center py-2">
        <div className="relative">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={phaseStroke[phase]}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-xl font-bold tabular-nums', phaseColor[phase])}>
              {formatSeconds(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={reset}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="초기화"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={isRunning ? pause : start}
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-all text-white',
              phase === 'work' ? 'bg-primary-500 hover:bg-primary-600'
              : phase === 'short_break' ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600',
            )}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </div>

        {/* Quick time display */}
        <p className="text-xs text-gray-400 mt-2">
          {workMinutes}분 집중 · {shortBreakMinutes}분 휴식
        </p>
      </div>
    </div>
  );
}
