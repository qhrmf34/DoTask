'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect }: Props) {
  const [current, setCurrent] = useState(selectedDate ?? new Date());
  const year = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data: calData } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => api.get(`/todos/calendar?year=${year}&month=${month}`).then((r) => r.data),
  });

  const dataMap = new Map<string, { total: number; done: number; pct: number }>(
    calData?.map((d: any) => [d.date, d]) ?? [],
  );

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = getDay(days[0]);

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          {format(current, 'yyyy년 M월', { locale: ko })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrent(new Date(year, month - 2, 1))}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month, 1))}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const info = dataMap.get(key);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={key}
              className="flex flex-col items-center gap-0.5 py-0.5"
              onClick={() => onDateSelect?.(day)}
            >
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs transition-colors',
                  onDateSelect && 'cursor-pointer',
                  selected && !today && 'bg-primary-100 text-primary-700 font-semibold',
                  today && 'bg-primary-500 text-white font-semibold',
                  !today && !selected && 'text-gray-700 hover:bg-gray-100',
                )}
              >
                {format(day, 'd')}
              </div>
              {info && info.total > 0 && (
                <div className="h-1 w-4 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className="h-full bg-primary-400 rounded-full"
                    style={{ width: `${info.pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
