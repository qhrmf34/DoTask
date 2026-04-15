'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, X, Globe, Lock, EyeOff, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const CATEGORIES = ['Study', 'Sports', 'Hobby', 'Work', 'Game', 'Other'];
const CATEGORY_LABELS: Record<string, string> = {
  Study: '공부',
  Sports: '스포츠',
  Hobby: '취미',
  Work: '업무',
  Game: '게임',
  Other: '기타',
};

const VISIBILITY_CONFIG = [
  { value: 'PUBLIC', label: '공개', desc: '누구나 가입 가능', icon: Globe },
  { value: 'PASSWORD', label: '비밀번호', desc: '비밀번호 필요', icon: Lock },
  { value: 'PRIVATE', label: '초대 전용', desc: '초대받은 사람만', icon: EyeOff },
] as const;

const schema = z.object({
  name: z.string().min(2, '크루 이름은 2자 이상이어야 합니다.').max(30),
  description: z.string().max(200).optional(),
  category: z.string().min(1, '카테고리를 선택해주세요.'),
  visibility: z.enum(['PUBLIC', 'PASSWORD', 'PRIVATE']),
  password: z.string().optional(),
  maxMembers: z.number().min(2).max(100),
});

type FormData = z.infer<typeof schema>;

export default function NewCrewPage() {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createdCrewId, setCreatedCrewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PUBLIC', maxMembers: 20 },
  });

  const visibility = watch('visibility');
  const category = watch('category');

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/upload/crew-banner', form);
      setBannerUrl(res.data.url);
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setBannerUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    try {
      const res = await api.post('/crews', { ...data, bannerImage: bannerUrl });
      if (data.visibility === 'PRIVATE' && res.data.inviteCode) {
        setInviteCode(res.data.inviteCode);
        setCreatedCrewId(res.data.id);
      } else {
        router.push(`/crews/${res.data.id}/board`);
      }
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || '크루 생성에 실패했습니다.');
    }
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/crews/invite/${inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inviteCode && createdCrewId) {
    const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/crews/invite/${inviteCode}` : '';
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <EyeOff className="h-7 w-7 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">크루가 생성됐어요!</h2>
            <p className="text-sm text-gray-500 mt-1">초대 전용 크루입니다. 아래 링크를 공유하세요.</p>
          </div>
          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 text-left">
            <p className="text-xs text-gray-500 flex-1 break-all">{inviteLink}</p>
            <button
              onClick={handleCopyInvite}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center bg-primary-100 hover:bg-primary-200 text-primary-600 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          {copied && <p className="text-xs text-primary-500 font-medium">링크가 복사됐습니다!</p>}
          <Button className="w-full" onClick={() => router.push(`/crews/${createdCrewId}/board`)}>
            크루로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-4">
        {/* Back */}
        <Link
          href="/crews"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> 크루 목록으로
        </Link>

        <div>
          <h1 className="text-xl font-bold text-gray-900">크루 만들기</h1>
          <p className="text-sm text-gray-400 mt-0.5">나만의 크루를 만들고 함께 성장하세요</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner section */}
          <section className="card overflow-hidden">
            <div
              className={cn(
                'relative h-40 bg-gray-100 cursor-pointer group',
                'hover:bg-gray-50 transition-colors',
              )}
              onClick={() => bannerRef.current?.click()}
            >
              {bannerUrl ? (
                <>
                  <Image src={bannerUrl} alt="크루 배너" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBannerUrl(null); }}
                    className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  {bannerUploading ? (
                    <div className="h-6 w-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                        <Camera className="h-5 w-5 text-gray-500" />
                      </div>
                      <span className="text-xs">배너 이미지 추가 (선택)</span>
                    </>
                  )}
                </div>
              )}
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </div>

            <div className="px-5 py-4 space-y-3">
              <Input
                label="크루 이름"
                placeholder="크루 이름을 입력하세요"
                error={errors.name?.message}
                {...register('name')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  소개 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="크루를 소개해주세요"
                  {...register('description')}
                />
              </div>
            </div>
          </section>

          {/* Category section */}
          <section className="card px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">카테고리</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('category', c)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm border transition-all font-medium',
                    category === c
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white',
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-2">{errors.category.message}</p>}
          </section>

          {/* Visibility section */}
          <section className="card px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">공개 설정</h2>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_CONFIG.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('visibility', value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center transition-all',
                    visibility === value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className={cn('text-[10px]', visibility === value ? 'text-primary-100' : 'text-gray-400')}>{desc}</span>
                </button>
              ))}
            </div>

            {visibility === 'PASSWORD' && (
              <div className="mt-3">
                <Input label="크루 비밀번호" type="password" placeholder="비밀번호를 입력하세요" {...register('password')} />
              </div>
            )}
          </section>

          {/* Max members section */}
          <section className="card px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">최대 인원</h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={2}
                max={100}
                className="input-field w-28"
                {...register('maxMembers', { valueAsNumber: true })}
              />
              <span className="text-sm text-gray-400">명 (최대 100명)</span>
            </div>
          </section>

          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {submitError}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            크루 만들기
          </Button>
        </form>
      </div>
    </div>
  );
}
