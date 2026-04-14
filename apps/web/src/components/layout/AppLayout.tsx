'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { CheckSquare, Users, Bell, Settings, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/todos', icon: CheckSquare, label: '할일' },
  { href: '/crews', icon: Users, label: '크루' },
  { href: '/notifications', icon: Bell, label: '알림' },
  { href: '/settings', icon: Settings, label: '설정' },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link href={href} className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
      active
        ? 'bg-primary-500 text-white shadow-sm shadow-primary-200'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
    )}>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-gray-100 bg-white shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b border-gray-100">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-sm shadow-primary-200">
            <CheckSquare className="h-4 w-4 text-white" />
          </div>
          <span className="hidden lg:block text-base font-bold text-gray-900">DoTask</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
          {user?.role === 'ADMIN' && <NavItem href="/admin" icon={Shield} label="관리자" />}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <Link href="/settings" className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-gray-50 transition-colors group">
            <Avatar src={user?.profileImage} fallback={user?.nickname} size="sm" />
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user?.nickname}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden mb-[57px] md:mb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40 safe-area-pb">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] font-semibold transition-colors',
                active ? 'text-primary-600' : 'text-gray-400',
              )}>
              <div className={cn('p-1 rounded-xl transition-all', active && 'bg-primary-50')}>
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
