'use client';

import React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) =>
      api.get(`/notifications${pageParam ? `?cursor=${pageParam}` : ''}`).then((r) => r.data),
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const notifications: Notification[] = data?.pages.flatMap((p) => p.items) ?? [];

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markOne = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    qc.setQueryData(['notifications'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p: any) => ({
          ...p,
          items: p.items.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n),
        })),
      };
    });
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">알림</h1>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> 모두 읽음
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Bell className="h-10 w-10 text-gray-200" />
            <p className="text-sm">알림이 없습니다</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne(n.id)}
                className={cn(
                  'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                  !n.isRead && 'bg-primary-50/50',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', n.isRead ? 'bg-gray-200' : 'bg-primary-500')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium')}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 text-center mt-3"
          >
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}
