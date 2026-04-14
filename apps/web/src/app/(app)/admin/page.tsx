'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Flag, Cpu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';

type Tab = 'overview' | 'users' | 'reports';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
    enabled: tab === 'users',
  });

  const { data: reportsData } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/admin/reports?status=PENDING').then((r) => r.data),
    enabled: tab === 'reports',
  });

  const toggleUser = async (id: string) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const resolveReport = async (id: string, status: 'REVIEWED' | 'DISMISSED') => {
    await api.patch(`/admin/reports/${id}`, { status });
    qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
  };

  const TABS = [
    { key: 'overview', label: '개요', icon: Cpu },
    { key: 'users', label: '유저', icon: Users },
    { key: 'reports', label: '신고', icon: Flag },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">관리자</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '전체 유저', value: stats.users, color: 'text-primary-600' },
              { label: '전체 크루', value: stats.crews, color: 'text-blue-600' },
              { label: '전체 게시글', value: stats.posts, color: 'text-green-600' },
              { label: '미처리 신고', value: stats.pendingReports, color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-gray-400">{label}</p>
                <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="card divide-y divide-gray-100">
            {usersData?.items?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={u.profileImage} fallback={u.nickname} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.nickname}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500')}>
                  {u.isActive ? '활성' : '비활성'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleUser(u.id)}
                  className={u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                >
                  {u.isActive ? '비활성화' : '활성화'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reportsData?.items?.map((r: any) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">{r.targetType}</span>
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">{r.reason}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {r.message?.content || r.post?.content || r.comment?.content || '—'}
                    </p>
                    {r.detail && <p className="text-xs text-gray-400 mt-1">{r.detail}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      신고자: {r.reporter.nickname} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => resolveReport(r.id, 'DISMISSED')}>무시</Button>
                    <Button size="sm" variant="danger" onClick={() => resolveReport(r.id, 'REVIEWED')}>처리</Button>
                  </div>
                </div>
              </div>
            ))}
            {reportsData?.items?.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">처리할 신고가 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
