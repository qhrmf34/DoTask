'use client';

import React from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Users, CheckSquare, MessageCircle } from 'lucide-react';
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

function NotifIcon({ type }: { type: string }) {
  const base = 'h-9 w-9 rounded-xl flex items-center justify-center shrink-0';
  if (type?.includes('CREW') || type?.includes('crew'))
    return <div className={cn(base, 'bg-primary-50')}><Users className="h-4 w-4 text-primary-500" /></div>;
  if (type?.includes('TODO') || type?.includes('todo'))
    return <div className={cn(base, 'bg-green-50')}><CheckSquare className="h-4 w-4 text-green-500" /></div>;
  if (type?.includes('COMMENT') || type?.includes('comment') || type?.includes('REACTION'))
    return <div className={cn(base, 'bg-amber-50')}><MessageCircle className="h-4 w-4 text-amber-500" /></div>;
  return <div className={cn(base, 'bg-gray-100')}><Bell className="h-4 w-4 text-gray-400" /></div>;
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
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">읽지 않은 알림 {unreadCount}개</p>
            )}
          </div>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> 모두 읽음
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card py-16 flex flex-col items-center gap-3 text-gray-400">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bell className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">알림이 없습니다</p>
            <p className="text-xs text-gray-400">크루 활동이 생기면 여기서 확인할 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne(n.id)}
                className={cn(
                  'card flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:shadow-md transition-all duration-200',
                  !n.isRead && 'border-primary-100 bg-primary-50/30',
                )}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                )}
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
