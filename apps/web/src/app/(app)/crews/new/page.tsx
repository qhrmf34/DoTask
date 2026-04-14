'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Camera, X } from 'lucide-react';
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
      alert(e.response?.data?.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setBannerUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/crews', { ...data, bannerImage: bannerUrl });
      router.push(`/crews/${res.data.id}/board`);
    } catch (e: any) {
      alert(e.response?.data?.message || '크루 생성에 실패했습니다.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <Link
          href="/crews"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 크루 목록으로
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">크루 만들기</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Banner image */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              크루 배너 이미지 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <div
              className={cn(
                'relative h-36 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50',
                'hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer',
              )}
              onClick={() => bannerRef.current?.click()}
            >
              {bannerUrl ? (
                <>
                  <Image src={bannerUrl} alt="크루 배너" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBannerUrl(null);
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  {bannerUploading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6" />
                      <span className="text-xs">클릭하여 이미지 업로드</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={bannerRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </div>
          </div>

          <Input
            label="크루 이름"
            placeholder="크루 이름을 입력하세요"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              소개 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="크루를 소개해주세요"
              {...register('description')}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('category', c)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    watch('category') === c
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">공개 설정</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PUBLIC', 'PASSWORD', 'PRIVATE'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue('visibility', v)}
                  className={cn(
                    'py-2 rounded-lg text-sm border transition-all',
                    visibility === v
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  )}
                >
                  {v === 'PUBLIC' ? '공개' : v === 'PASSWORD' ? '비밀번호' : '초대 전용'}
                </button>
              ))}
            </div>
          </div>

          {visibility === 'PASSWORD' && (
            <Input label="크루 비밀번호" type="password" placeholder="비밀번호를 입력하세요" {...register('password')} />
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">최대 인원</label>
            <input
              type="number"
              min={2}
              max={100}
              className="input-field w-32"
              {...register('maxMembers', { valueAsNumber: true })}
            />
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            크루 만들기
          </Button>
        </form>
      </div>
    </div>
  );
}
