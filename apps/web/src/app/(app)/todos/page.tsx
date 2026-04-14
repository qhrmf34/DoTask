'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-5">
          <p className="text-sm text-gray-400">
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            안녕하세요, {user?.nickname}님
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: date nav + category filter + todo list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Date navigator */}
            <div className="card px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setSelectedDate((d) => subDays(d, 1))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
                </p>
                {isToday(selectedDate) && (
                  <span className="text-xs text-primary-500 font-medium">오늘</span>
                )}
                {total > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {done}/{total} 완료
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Today shortcut */}
            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                오늘로 돌아가기
              </button>
            )}

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    !categoryFilter
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  )}
                >
                  전체
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                      categoryFilter === cat.id
                        ? 'text-white border-transparent'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
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
