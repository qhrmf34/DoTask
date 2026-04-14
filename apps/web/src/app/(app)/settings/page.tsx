'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, LogOut, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const PRESET_COLORS = ['#7c6ff7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

interface Category { id: string; name: string; color: string }

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const { data: stats } = useQuery<{ totalCompleted: number; monthPct: number; crewCount: number; streak: number }>({
    queryKey: ['me-stats'],
    queryFn: () => api.get('/users/me/stats').then((r) => r.data).catch(() => null),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['todo-categories'],
    queryFn: () => api.get('/todo-categories').then((r) => r.data).catch(() => []),
  });

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setBio(profile.bio ?? '');
    }
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
      const res = await api.post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await api.post('/todo-categories', { name: newCatName.trim(), color: newCatColor });
      qc.invalidateQueries({ queryKey: ['todo-categories'] });
      setNewCatName('');
      setAddingCat(false);
    } catch {}
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('카테고리를 삭제할까요?')) return;
    try {
      await api.delete(`/todo-categories/${id}`);
      qc.invalidateQueries({ queryKey: ['todo-categories'] });
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>

        {/* Stats */}
        {stats && (
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">내 활동</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">완료한 할일</span>
                <span className="text-sm font-semibold text-gray-900">{stats.totalCompleted}개</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">이번 달 달성률</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${stats.monthPct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-9 text-right">{stats.monthPct}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">참여 중인 크루</span>
                <span className="text-sm font-semibold text-gray-900">{stats.crewCount}개</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">연속 달성</span>
                <span className="text-sm font-semibold text-gray-900">{stats.streak}일째</span>
              </div>
            </div>
          </section>
        )}

        {/* Profile */}
        <section className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">프로필</h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user?.profileImage} fallback={user?.nickname} size="lg" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm hover:bg-primary-600 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.nickname}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <Input label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">소개</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="간단한 소개를 작성하세요"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveProfile}>저장</Button>
        </section>

        {/* Categories */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">할일 카테고리</h2>
            <button
              onClick={() => setAddingCat(true)}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> 추가
            </button>
          </div>

          {addingCat && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
              <input
                autoFocus
                className="input-field text-sm py-1.5 bg-white"
                placeholder="카테고리 이름"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewCatColor(c)}
                    className={cn('h-5 w-5 rounded-full transition-transform', newCatColor === c && 'ring-2 ring-offset-1 ring-gray-400 scale-110')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCategory}
                  className="flex-1 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600">
                  만들기
                </button>
                <button onClick={() => { setAddingCat(false); setNewCatName(''); }}
                  className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs">
                  취소
                </button>
              </div>
            </div>
          )}

          {categories.length === 0 && !addingCat ? (
            <p className="text-sm text-gray-400 py-2">카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 group">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Account */}
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">계정</h2>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-600">
            <LogOut className="h-4 w-4" /> 로그아웃
          </Button>
        </section>
      </div>
    </div>
  );
}
