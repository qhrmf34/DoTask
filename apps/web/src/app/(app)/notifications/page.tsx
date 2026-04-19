'use client';

import React from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Users, FileText, ShieldCheck, MessageCircle, ThumbsUp, UserPlus } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: { crewId?: string; postId?: string; [key: string]: any };
}

type NotifConfig = {
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
};

function getNotifConfig(type: string): NotifConfig {
  if (type === 'NEW_POST')
    return { icon: <FileText className="h-4 w-4" />, bg: 'bg-violet-50', color: 'text-violet-500', label: '새 게시글' };
  if (type === 'REPORT_PROCESSED')
    return { icon: <ShieldCheck className="h-4 w-4" />, bg: 'bg-blue-50', color: 'text-blue-500', label: '신고 처리' };
  if (type?.includes('COMMENT'))
    return { icon: <MessageCircle className="h-4 w-4" />, bg: 'bg-amber-50', color: 'text-amber-500', label: '댓글' };
  if (type?.includes('REACTION'))
    return { icon: <ThumbsUp className="h-4 w-4" />, bg: 'bg-pink-50', color: 'text-pink-500', label: '반응' };
  if (type?.includes('CREW') || type?.includes('JOIN'))
    return { icon: <UserPlus className="h-4 w-4" />, bg: 'bg-green-50', color: 'text-green-500', label: '크루' };
  return { icon: <Bell className="h-4 w-4" />, bg: 'bg-gray-100', color: 'text-gray-400', label: '알림' };
}

// 날짜 그룹 키
function dateGroupKey(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return '이번 주';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();

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
    qc.invalidateQueries({ queryKey: ['notifications-unread'] });
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
    qc.invalidateQueries({ queryKey: ['notifications-unread'] });
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) await markOne(n.id);
    if (n.type === 'NEW_POST' && n.data?.crewId && n.data?.postId) {
      router.push(`/crews/${n.data.crewId}/board`);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 날짜 그룹으로 묶기
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const key = dateGroupKey(n.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const GROUP_ORDER = ['오늘', '어제', '이번 주'];
  const sortedGroups = [
    ...GROUP_ORDER.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g)),
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">

        {/* Outer card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #eeeeee' }}>
            <div>
              <h1 className="text-xl font-bold text-gray-900">알림</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">읽지 않은 알림 <span className="text-primary-500 font-semibold">{unreadCount}개</span></p>
              )}
            </div>
            {hasUnread && (
              <Button variant="ghost" size="sm" onClick={markAll} className="gap-1.5">
                <CheckCheck className="h-4 w-4" /> 모두 읽음
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">알림이 없습니다</p>
              <p className="text-xs text-gray-400">크루 활동이 생기면 여기서 확인할 수 있어요</p>
            </div>
          ) : (
            <div>
              {sortedGroups.map((group) => (
                <div key={group}>
                  {/* Date group label */}
                  <div className="px-5 py-2" style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <p className="text-xs font-bold text-gray-400">{group}</p>
                  </div>
                  {/* Notifications in group */}
                  <div className="divide-y divide-gray-50">
                    {grouped[group].map((n) => {
                      const cfg = getNotifConfig(n.type);
                      const isClickable = n.type === 'NEW_POST' && n.data?.crewId;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleClick(n)}
                          className={cn(
                            'flex items-start gap-3.5 px-5 py-4 transition-colors',
                            !n.isRead && 'bg-primary-50/30',
                            (isClickable || !n.isRead) && 'cursor-pointer hover:bg-gray-50',
                          )}
                        >
                          {/* 아이콘 */}
                          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                            {cfg.icon}
                          </div>

                          {/* 내용 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                                  {cfg.label}
                                </span>
                                <p className={cn('text-sm leading-snug', n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                                  {n.title}
                                </p>
                              </div>
                              {!n.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                            <p className="text-[11px] text-gray-400 mt-1.5">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 text-center mt-4"
          >
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}
