'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut } from 'lucide-react';
import { useDialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
// cn kept for potential future use
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

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const { data: stats } = useQuery<{ totalCompleted: number; monthPct: number; crewCount: number; streak: number }>({
    queryKey: ['me-stats'],
    queryFn: () => api.get('/users/me/stats').then((r) => r.data).catch(() => null),
  });

  useEffect(() => {
    if (profile) { setNickname(profile.nickname); setBio(profile.bio ?? ''); }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      const res = await api.patch('/users/me', { nickname, bio });
      setUser(res.data);
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e: any) {
      alert(e.response?.data?.message || '프로필 저장에 실패했습니다.');
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
    } catch (e: any) {
      alert(e.response?.data?.message || '프로필 사진 업로드에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    router.push('/login');
  };

  const statItems = stats ? [
    { label: '완료', value: stats.totalCompleted, unit: '개' },
    { label: '이번달', value: stats.monthPct, unit: '%' },
    { label: '크루', value: stats.crewCount, unit: '개' },
    { label: '연속', value: stats.streak, unit: '일' },
  ] : [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 px-1">설정</h1>

        {/* ── Profile card ── */}
        <section className="card overflow-hidden">
          {/* Profile header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative shrink-0">
                <Avatar src={user?.profileImage} fallback={user?.nickname} size="lg" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center shadow hover:bg-gray-700 transition-colors"
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{user?.nickname}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Stats */}
            {statItems.length > 0 && (
              <div className="grid grid-cols-4 divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {statItems.map((s) => (
                  <div key={s.label} className="py-3 text-center">
                    <p className="text-base font-bold text-gray-900 leading-none">
                      {s.value}<span className="text-xs font-medium text-gray-400">{s.unit}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit form */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">프로필 수정</p>
            <Input label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">소개</label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="간단한 소개를 작성하세요"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">저장</Button>
          </div>
        </section>

        {/* ── Account ── */}
        <section className="card p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">계정</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </section>
      </div>
    </div>
  );
}
