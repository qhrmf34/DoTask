'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { TodoList } from '@/components/todos/TodoList';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import api from '@/lib/api';

export default function TodosPage() {
  const user = useAuthStore((s) => s.user);
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

  const done = filteredTodos.filter((t: any) => t.isCompleted).length;
  const total = filteredTodos.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-20 md:pb-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {user?.nickname}님의 할일
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">

            {/* Date navigator + progress */}
            <div className="card px-5 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedDate((d) => subDays(d, 1))}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
                      </p>
                      {isToday(selectedDate) && (
                        <span className="text-xs text-primary-500 font-medium">오늘</span>
                      )}
                    </div>
                    {total > 0 && (
                      <span className={cn('text-sm font-bold tabular-nums', pct === 100 ? 'text-green-500' : 'text-primary-500')}>
                        {done}/{total}
                      </span>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-green-400' : 'bg-primary-400')}
                        style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                <button onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {!isToday(selectedDate) && (
                <button onClick={() => setSelectedDate(new Date())}
                  className="mt-3 w-full py-1.5 text-xs text-primary-500 font-medium border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors">
                  오늘로 돌아가기
                </button>
              )}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => setCategoryFilter(null)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    !categoryFilter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300')}>
                  전체
                </button>
                {categories.map((cat: any) => (
                  <button key={cat.id}
                    onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                      categoryFilter === cat.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}
                    style={categoryFilter === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <TodoList todos={filteredTodos} onRefetch={refetch} date={dateStr} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PomodoroTimer />
            <MiniCalendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
