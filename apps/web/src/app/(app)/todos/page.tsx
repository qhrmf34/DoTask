'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { TodoList } from '@/components/todos/TodoList';
import { MiniCalendar, type CalendarEvent } from '@/components/calendar/MiniCalendar';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import api from '@/lib/api';

const EVENT_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
const EVENT_EMOJIS = ['📝','🎂','💊','✈️','🏃','🎉','💼','📖','🏆','⚠️'];

function EventPanel({
  date, events, onCreated, onDeleted,
}: {
  date: string;
  events: CalendarEvent[];
  onCreated: () => void;
  onDeleted: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [emoji, setEmoji] = useState('📅');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.post('/todos/calendar/events', { title: title.trim(), date, color, emoji });
      setTitle(''); setAdding(false);
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/todos/calendar/events/${id}`).catch(() => {});
    onDeleted();
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          {format(new Date(date + 'T00:00:00'), 'M월 d일')} 이벤트
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-violet-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <input
            className="input-field text-sm w-full"
            placeholder="이벤트 이름 (예: 중간고사, 생일)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
            maxLength={30}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {EVENT_EMOJIS.map((em) => (
              <button key={em} onClick={() => setEmoji(em)}
                className={cn('text-base leading-none p-1 rounded-lg transition-colors', emoji === em ? 'bg-gray-200' : 'hover:bg-gray-100')}>
                {em}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {EVENT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn('h-5 w-5 rounded-full transition-transform', color === c && 'scale-125 ring-2 ring-offset-1 ring-gray-400')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-100">취소</button>
            <button onClick={handleAdd} disabled={saving || !title.trim()}
              className="flex-1 py-1.5 text-xs font-semibold text-white rounded-xl disabled:opacity-40 transition-colors"
              style={{ backgroundColor: color }}>
              {saving ? '저장 중...' : '추가'}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 && !adding ? (
        <p className="text-xs text-gray-400 text-center py-2">이벤트가 없습니다</p>
      ) : (
        <div className="space-y-1.5">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-gray-50 group">
              <span className="text-base leading-none">{e.emoji}</span>
              <span className="flex-1 text-xs font-medium text-gray-700 truncate">{e.title}</span>
              <button onClick={() => handleDelete(e.id)}
                className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center text-gray-400 hover:text-red-400 transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodosPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: todos = [], refetch } = useQuery({
    queryKey: ['todos', dateStr],
    queryFn: () => api.get(`/todos?date=${dateStr}`).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['todo-categories'],
    queryFn: () => api.get('/todo-categories').then((r) => r.data).catch(() => []),
  });

  const filteredTodos = categoryFilter
    ? todos.filter((t: any) => t.category?.id === categoryFilter)
    : todos;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data: monthlyStats } = useQuery({
    queryKey: ['todos-monthly-stats', year, month],
    queryFn: () => api.get(`/todos/monthly-stats?year=${year}&month=${month}`).then((r) => r.data),
  });

  const monthlyPct: number = monthlyStats?.monthlyPct ?? 0;
  const activeDays: number = monthlyStats?.activeDays ?? 0;
  const daysInMonth: number = monthlyStats?.daysInMonth ?? new Date(year, month, 0).getDate();

  const { data: calData } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => api.get(`/todos/calendar?year=${year}&month=${month}`).then((r) => r.data),
  });
  const dayEvents: CalendarEvent[] = (calData?.events ?? []).filter((e: CalendarEvent) => e.date === dateStr);

  const invalidateCal = () => qc.invalidateQueries({ queryKey: ['calendar', year, month] });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-20 md:pb-6">

        {/* ── Header ── */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {user?.nickname}님의 할일
          </h1>

          {/* Monthly progress */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  monthlyPct >= 100 ? 'bg-mint-400' : 'progress-shimmer',
                )}
                style={{ width: `${Math.min(monthlyPct, 100)}%` }}
              />
            </div>
            <span className={cn('text-sm font-bold tabular-nums shrink-0', monthlyPct >= 100 ? 'text-mint-500' : 'text-primary-600')}>
              {monthlyPct}%
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {month}월 · {activeDays}/{daysInMonth}일
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Date navigator */}
            <div className="card px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDate((d) => subDays(d, 1))}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 text-center">
                  <p className="text-sm font-bold text-gray-900">
                    {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
                  </p>
                  {isToday(selectedDate) ? (
                    <span className="text-xs text-primary-500 font-medium">오늘</span>
                  ) : (
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="text-xs text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      오늘로 돌아가기
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    !categoryFilter
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300',
                  )}
                >
                  전체
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                      categoryFilter === cat.id
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                    style={categoryFilter === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <TodoList todos={filteredTodos} onRefetch={refetch} date={dateStr} />
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <PomodoroTimer />
            <MiniCalendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
            <EventPanel
              date={dateStr}
              events={dayEvents}
              onCreated={invalidateCal}
              onDeleted={invalidateCal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
