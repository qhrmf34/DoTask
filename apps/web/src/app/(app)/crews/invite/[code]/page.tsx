'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Crown, Users, Tag, Lock } from 'lucide-react';
import { resolveUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const CATEGORY_LABELS: Record<string, string> = {
  Study: '공부', Sports: '스포츠', Hobby: '취미', Work: '업무', Game: '게임', Other: '기타',
};
const CATEGORY_COLORS: Record<string, string> = {
  Study: '#7c6ff7', Sports: '#22c55e', Hobby: '#ec4899', Work: '#3b82f6', Game: '#f59e0b', Other: '#6b7280',
};

export default function InvitePage({ params }: { params: { code: string } }) {
  const { code } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.replace(`/login?redirect=/crews/invite/${code}`);
    }
  }, [accessToken, code, router]);

  const { data: crew, isLoading, isError } = useQuery({
    queryKey: ['invite', code],
    queryFn: () => api.get(`/crews/invite/${code}`).then((r) => r.data),
    retry: false,
  });

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await api.post(`/crews/invite/${code}/join`);
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      router.push(`/crews/${crew.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '가입에 실패했습니다.');
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#f7f8fa' }}>
        <p className="text-sm text-gray-400">초대 링크 확인 중...</p>
      </div>
    );
  }

  if (isError || !crew) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#f7f8fa' }}>
        <div className="text-center px-6">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-base font-bold text-gray-700 mb-1">유효하지 않은 초대 링크입니다</p>
          <p className="text-sm text-gray-400 mb-6">링크가 만료됐거나 잘못된 주소일 수 있어요</p>
          <Button variant="ghost" onClick={() => router.push('/crews')}>크루 목록으로</Button>
        </div>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[crew.category] ?? '#6b7280';
  const owner = crew.members?.[0]?.user ?? null;
  const memberPct = Math.round((crew._count.members / crew.maxMembers) * 100);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8" style={{ background: '#f7f8fa' }}>
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm overflow-hidden" style={{ border: '1px solid #ddd6fe' }}>

        {/* 배너 */}
        <div className="relative h-40 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${catColor}40, ${catColor}80)` }}>
          {crew.bannerImage && (
            <img src={resolveUrl(crew.bannerImage)} alt={crew.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5">
            <p className="text-xs text-white/70 mb-1">초대장</p>
            <h2 className="text-xl font-extrabold text-white drop-shadow">{crew.name}</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 inline-block"
              style={{ backgroundColor: catColor + 'cc', color: 'white' }}>
              {CATEGORY_LABELS[crew.category] ?? crew.category}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {crew.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{crew.description}</p>
          )}

          {/* 방장 + 멤버 */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50">
            {owner && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar src={owner.profileImage} fallback={owner.nickname} size="sm" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium">방장</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{owner.nickname}</p>
                </div>
              </div>
            )}
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">멤버</p>
              <p className="text-sm font-bold text-gray-800">
                {crew._count.members}<span className="text-gray-400 text-xs font-normal">/{crew.maxMembers}</span>
              </p>
            </div>
          </div>

          {/* 게이지 */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-400">모집 현황</span>
              <span className="text-xs font-bold" style={{ color: catColor }}>{memberPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${memberPct}%`, backgroundColor: catColor }} />
            </div>
          </div>

          {/* 태그 */}
          {crew.tags && crew.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {crew.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  <Tag className="h-2.5 w-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => router.push('/crews')}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleJoin} disabled={joining}>
              {joining ? '가입 중...' : '크루 가입하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
