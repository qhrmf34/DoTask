'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Users, Bell, Settings, Shield, ListTodo, LogOut, ChevronUp } from 'lucide-react';

// NAV_ITEMS는 각 렌더 위치에서 직접 badge prop과 함께 선언

function NavItem({ href, icon: Icon, label, badge }: {
  href: string; icon: React.ElementType; label: string; badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer',
        active
          ? 'bg-primary-500 text-white shadow-sm shadow-primary-300/40'
          : 'text-gray-500 hover:bg-primary-50 hover:text-primary-700',
      )}
    >
      <div className="relative shrink-0">
        <Icon className="h-[18px] w-[18px]" />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30000,
  });
  const unreadCount: number = unreadData?.count ?? 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: '#f7f8fa' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #f3f2fe 0%, #f7f8fa 100%)',
          borderRight: '1px solid #e8e4f8',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-4" style={{ borderBottom: '1px solid #e8e4f8' }}>
          <div className="shrink-0 hover-wiggle cursor-default">
            <img src="/mascot/mascot_running.png" alt="DoTask" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="hidden lg:block">
            <span className="text-base font-extrabold tracking-tight" style={{ color: '#7c3aed' }}>
              DoTask
            </span>
            <span className="block text-[10px] font-medium" style={{ color: '#a78bfa' }}>
              할일 관리
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">
          <NavItem href="/todos" icon={ListTodo} label="할일" />
          <NavItem href="/crews" icon={Users} label="크루" />
          <NavItem href="/notifications" icon={Bell} label="알림" badge={unreadCount} />
          <NavItem href="/settings" icon={Settings} label="설정" />
          {user?.role === 'ADMIN' && <NavItem href="/admin" icon={Shield} label="관리자" />}
        </nav>

        {/* User */}
        <div className="p-3 relative" style={{ borderTop: '1px solid #e8e4f8' }} ref={menuRef}>
          {/* Popup menu */}
          {userMenuOpen && (
            <div
              className="absolute left-2 right-2 bottom-full mb-2 rounded-2xl overflow-hidden shadow-soft z-50"
              style={{ background: 'white', border: '1px solid #e8e4f8' }}
            >
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="font-medium">설정</span>
              </Link>
              <div style={{ height: '1px', background: '#f3f4f6' }} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-2xl px-2 py-2 transition-colors',
              userMenuOpen ? 'bg-primary-100' : 'hover:bg-primary-50',
            )}
          >
            <Avatar src={user?.profileImage} fallback={user?.nickname} size="sm" />
            <div className="hidden lg:flex flex-1 min-w-0 items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate leading-tight text-left" style={{ color: '#38334a' }}>{user?.nickname}</p>
                <p className="text-xs text-gray-400 truncate text-left">{user?.email}</p>
              </div>
              <ChevronUp className={cn('h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform', !userMenuOpen && 'rotate-180')} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden mb-[57px] md:mb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex z-40 safe-area-pb"
        style={{ background: 'white', borderTop: '1.5px solid #ddd6fe' }}>
        {[
          { href: '/todos', icon: ListTodo, label: '할일' },
          { href: '/crews', icon: Users, label: '크루' },
          { href: '/notifications', icon: Bell, label: '알림', badge: unreadCount },
          { href: '/settings', icon: Settings, label: '설정' },
        ].map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] font-semibold transition-colors',
                active ? 'text-primary-600' : 'text-gray-400',
              )}
            >
              <div className={cn('relative p-1 rounded-2xl transition-all', active && 'bg-primary-100')}>
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
