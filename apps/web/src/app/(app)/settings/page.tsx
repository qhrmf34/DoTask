'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut, CheckCircle2, TrendingUp, Users, Flame } from 'lucide-react';
import { useDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { confirm } = useDialog();
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const now = new Date();
  const { data: stats } = useQuery<{ totalCompleted: number; monthPct: number; crewCount: number; streak: number }>({
    queryKey: ['me-stats'],
    queryFn: () => api.get('/users/me/stats').then((r) => r.data).catch(() => null),
  });

  const { data: monthlyStats } = useQuery<{ monthlyPct: number }>({
    queryKey: ['todos-monthly-stats', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => api.get(`/todos/monthly-stats?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then((r) => r.data).catch(() => null),
  });

  useEffect(() => {
    if (profile) { setNickname(profile.nickname); setBio(profile.bio ?? ''); }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      const res = await api.patch('/users/me', { nickname, bio });
      setUser(res.data);
      qc.invalidateQueries({ queryKey: ['me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      await confirm({ title: '오류', message: e.response?.data?.message || '저장에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser({ ...user!, profileImage: res.data.profileImage });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch {}
  };

  const handleLogout = async () => {
    const ok = await confirm({ title: '로그아웃', message: '정말 로그아웃 할까요?', confirmText: '로그아웃', cancelText: '취소', type: 'danger' });
    if (!ok) return;
    await api.post('/auth/logout').catch(() => {});
    logout();
    router.push('/login');
  };

  const statItems = stats ? [
    { icon: <CheckCircle2 className="h-4 w-4" />, label: '완료한 할일', value: stats.totalCompleted, unit: '개', color: '#7c6ff7' },
    { icon: <TrendingUp className="h-4 w-4" />, label: '이번달 달성률', value: monthlyStats?.monthlyPct ?? stats.monthPct, unit: '%', color: '#22c55e' },
    { icon: <Users className="h-4 w-4" />, label: '참여 크루', value: stats.crewCount, unit: '개', color: '#3b82f6' },
    { icon: <Flame className="h-4 w-4" />, label: '연속 달성', value: stats.streak, unit: '일', color: '#f59e0b' },
  ] : [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-4">

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>

          {/* 상단 - 아바타 + 이름 */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar src={user?.profileImage} fallback={user?.nickname} size="lg" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-md hover:bg-gray-700 transition-colors"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-base truncate">{user?.nickname}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>

          {/* 통계 */}
          {statItems.length > 0 && (
            <div className="grid grid-cols-4 gap-px mx-6 mb-5 rounded-xl overflow-hidden bg-gray-100">
              {statItems.map((s) => (
                <div key={s.label} className="bg-white py-3.5 text-center">
                  <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-base font-extrabold text-gray-900 leading-none">
                    {s.value}<span className="text-xs font-medium text-gray-400">{s.unit}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight px-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* 구분선 */}
          <div className="border-t border-gray-100 mx-6" />

          {/* 편집 폼 */}
          <div className="px-6 py-5 space-y-4">
            <Input label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">소개</label>
                <span className={`text-[11px] tabular-nums ${bio.length >= 90 ? 'text-red-400' : 'text-gray-300'}`}>
                  {bio.length}/100
                </span>
              </div>
              <textarea
                className="input-field resize-none"
                rows={3}
                maxLength={100}
                placeholder="나를 한 줄로 소개해보세요"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              {saved ? '저장됐어요!' : '저장'}
            </Button>
          </div>
        </div>

        {/* 계정 카드 */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-6 py-4 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </div>

      </div>
    </div>
  );
}
