'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const schema = z
  .object({
    email: z.string().email('올바른 이메일을 입력하세요'),
    nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20, '닉네임은 20자 이하여야 합니다'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(/(?=.*[a-zA-Z])(?=.*\d)/, '영문자와 숫자를 모두 포함해야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력하세요'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { confirmPassword, ...payload } = data;
      const res = await api.post('/auth/register', payload);
      setAccessToken(res.data.accessToken);
      if (res.data.refreshToken) setRefreshToken(res.data.refreshToken);
      const me = await api.get('/users/me');
      setUser(me.data);
      router.push('/todos');
    } catch (e: any) {
      setError(e.response?.data?.message || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">회원가입</h2>
        <p className="text-sm text-gray-500 mt-1">DoTask와 함께 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="이메일"
          type="email"
          placeholder="hello@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="닉네임"
          placeholder="닉네임을 입력하세요"
          error={errors.nickname?.message}
          {...register('nickname')}
        />

        {/* Password with eye toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">비밀번호</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="영문+숫자 8자 이상"
              className="input-field pr-10 w-full"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Confirm password with eye toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">비밀번호 확인</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력하세요"
              className="input-field pr-10 w-full"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          가입하기
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
