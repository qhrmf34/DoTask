'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Flag, Hash, Search, Trash2, Bell,
  UserX, Check, X, ChevronLeft, ChevronRight, MessageSquare, ArrowLeft, FileText, ChevronRight as _CR,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatDate, resolveUrl } from '@/lib/utils';
import api from '@/lib/api';

type Tab = 'overview' | 'users' | 'crews' | 'reports';

const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: '스팸/홍보', ABUSE: '욕설/비방', HATE: '혐오/차별',
  INAPPROPRIATE: '부적절한 내용', OTHER: '기타',
};

// ── 페이지네이션 컴포넌트 ─────────────────────────────────────────
function Pagination({ page, total, limit, onChange }: {
  page: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-xl text-sm font-medium transition-colors',
            p === page
              ? 'text-white shadow-sm'
              : 'border border-gray-200 text-gray-500 hover:bg-gray-50',
          )}
          style={p === page ? { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' } : {}}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <span className="text-xs text-gray-400 ml-2">
        {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} / {total}건
      </span>
    </div>
  );
}

// ── 크루 상세 뷰 ─────────────────────────────────────────────────
function CrewDetail({ crew, onBack }: { crew: any; onBack: () => void }) {
  const [detailTab, setDetailTab] = useState<'posts' | 'messages'>('posts');
  const [postsPage, setPostsPage] = useState(1);
  const [msgsPage, setMsgsPage] = useState(1);
  const qc = useQueryClient();

  const { data: postsData } = useQuery({
    queryKey: ['admin', 'crew-posts', crew.id, postsPage],
    queryFn: () => api.get(`/admin/crews/${crew.id}/posts?page=${postsPage}&limit=10`).then((r) => r.data),
    enabled: detailTab === 'posts',
  });

  const { data: msgsData } = useQuery({
    queryKey: ['admin', 'crew-messages', crew.id, msgsPage],
    queryFn: () => api.get(`/admin/crews/${crew.id}/messages?page=${msgsPage}&limit=10`).then((r) => r.data),
    enabled: detailTab === 'messages',
  });

  const deletePost = async (id: string) => {
    if (!confirm('게시글을 삭제할까요?')) return;
    await api.delete(`/admin/posts/${id}`);
    qc.invalidateQueries({ queryKey: ['admin', 'crew-posts', crew.id] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const deleteMsg = async (id: string) => {
    if (!confirm('메시지를 삭제할까요?')) return;
    await api.delete(`/admin/messages/${id}`);
    qc.invalidateQueries({ queryKey: ['admin', 'crew-messages', crew.id] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> 크루 목록으로
      </button>

      {/* Crew info card */}
      <div
        className="rounded-3xl overflow-hidden border border-gray-100"
        style={{ background: `linear-gradient(135deg, ${crew.themeColor}18, white)` }}
      >
        {crew.bannerImage && (
          <img src={resolveUrl(crew.bannerImage)} alt="" className="w-full h-24 object-cover" />
        )}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 text-lg">{crew.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: crew.themeColor + '22', color: crew.themeColor }}>
                {crew.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {crew.visibility === 'PUBLIC' ? '공개' : crew.visibility === 'PASSWORD' ? '비밀번호' : '비공개'}
              </span>
            </div>
            {crew.description && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{crew.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>멤버 {crew._count?.members ?? 0} / {crew.maxMembers}명</span>
              <span>게시글 {crew._count?.posts ?? 0}개</span>
              <span>채널 {crew._count?.channels ?? 0}개</span>
              <span>{formatDate(crew.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setDetailTab('posts')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            detailTab === 'posts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <FileText className="h-4 w-4" /> 게시글
        </button>
        <button
          onClick={() => setDetailTab('messages')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            detailTab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <MessageSquare className="h-4 w-4" /> 채팅
        </button>
      </div>

      {/* Posts */}
      {detailTab === 'posts' && (
        <div className="space-y-2">
          {postsData?.items?.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">게시글이 없습니다.</p>
          )}
          {postsData?.items?.map((p: any) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <Avatar src={p.user?.profileImage} fallback={p.user?.nickname} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{p.user?.nickname}</span>
                  {p._count?.reports > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">
                      신고 {p._count.reports}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(p.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{p.content}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>댓글 {p._count?.comments ?? 0}</span>
                  <span>반응 {p._count?.reactions ?? 0}</span>
                </div>
              </div>
              <button
                onClick={() => deletePost(p.id)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {postsData && (
            <Pagination page={postsPage} total={postsData.total} limit={10} onChange={setPostsPage} />
          )}
        </div>
      )}

      {/* Messages */}
      {detailTab === 'messages' && (
        <div className="space-y-2">
          {msgsData?.items?.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">메시지가 없습니다.</p>
          )}
          {msgsData?.items?.map((m: any) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <Avatar src={m.user?.profileImage} fallback={m.user?.nickname} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{m.user?.nickname}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">#{m.channel?.name}</span>
                  {m._count?.reports > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">
                      신고 {m._count.reports}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(m.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{m.content}</p>
              </div>
              <button
                onClick={() => deleteMsg(m.id)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {msgsData && (
            <Pagination page={msgsPage} total={msgsData.total} limit={10} onChange={setMsgsPage} />
          )}
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [crewSearch, setCrewSearch] = useState('');
  const [crewPage, setCrewPage] = useState(1);
  const [reportStatus, setReportStatus] = useState<'PENDING' | 'REVIEWED' | 'DISMISSED'>('PENDING');
  const [reportPage, setReportPage] = useState(1);
  const [selectedCrew, setSelectedCrew] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', userSearch, userPage],
    queryFn: () => api.get(`/admin/users?page=${userPage}&limit=10${userSearch ? `&search=${encodeURIComponent(userSearch)}` : ''}`).then((r) => r.data),
    enabled: tab === 'users',
  });

  const { data: crewsData } = useQuery({
    queryKey: ['admin', 'crews', crewSearch, crewPage],
    queryFn: () => api.get(`/admin/crews?page=${crewPage}&limit=10${crewSearch ? `&search=${encodeURIComponent(crewSearch)}` : ''}`).then((r) => r.data),
    enabled: tab === 'crews',
  });

  const { data: reportsData } = useQuery({
    queryKey: ['admin', 'reports', reportStatus, reportPage],
    queryFn: () => api.get(`/admin/reports?status=${reportStatus}&page=${reportPage}&limit=10`).then((r) => r.data),
    enabled: tab === 'reports',
  });

  const toggleUser = async (id: string) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const deleteCrew = async (id: string) => {
    if (!confirm('크루를 삭제할까요?')) return;
    await api.delete(`/admin/crews/${id}`);
    qc.invalidateQueries({ queryKey: ['admin', 'crews'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const resolveReport = async (id: string, status: 'REVIEWED' | 'DISMISSED') => {
    await api.patch(`/admin/reports/${id}`, { status });
    qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const [notifyModal, setNotifyModal] = useState<{ reportId: string } | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('');

  const openNotifyModal = (id: string) => {
    setNotifyMessage('');
    setNotifyModal({ reportId: id });
  };

  const sendNotify = async () => {
    if (!notifyModal || !notifyMessage.trim()) return;
    await api.post(`/admin/reports/${notifyModal.reportId}/notify`, { message: notifyMessage.trim() });
    setNotifyModal(null);
  };

  const deactivateUserFromReport = async (userId: string, reportId: string) => {
    if (!confirm('이 유저를 비활성화할까요?')) return;
    await api.patch(`/admin/users/${userId}/toggle-active`);
    await resolveReport(reportId, 'REVIEWED');
    qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const TABS = [
    { key: 'overview', label: '개요' },
    { key: 'users', label: '유저' },
    { key: 'crews', label: '크루' },
    { key: 'reports', label: '신고', badge: stats?.pendingReports },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-8">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #eeeeee' }}>
            <h1 className="text-xl font-bold text-gray-900">관리자 패널</h1>
            {stats && (
              <span className="text-xs text-gray-400">
                유저 {stats.users}명 · 크루 {stats.crews}개 · 미처리 신고 {stats.pendingReports}건
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
            {TABS.map(({ key, label, badge }: any) => (
              <button
                key={key}
                onClick={() => { setTab(key as Tab); setSelectedCrew(null); }}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  tab === key
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                )}
                style={tab === key ? { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' } : {}}
              >
                {label}
                {badge > 0 && (
                  <span className={cn(
                    'h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                    tab === key ? 'bg-white/30 text-white' : 'bg-red-500 text-white',
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-3">

        {/* ── Overview ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f5f3ff' }}>
                  <Users className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.users ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">전체 유저</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eff6ff' }}>
                  <Hash className="h-5 w-5" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.crews ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">활성 크루</p>
                </div>
              </div>
            </div>

            {stats.pendingReports > 0 && (
              <button
                onClick={() => setTab('reports')}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-colors hover:opacity-90"
                style={{ background: '#fff5f5', borderColor: '#fecaca' }}
              >
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Flag className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-700">미처리 신고 {stats.pendingReports}건</p>
                  <p className="text-xs text-red-400">클릭하여 신고 관리 페이지로 이동</p>
                </div>
                <ChevronRight className="h-4 w-4 text-red-300 ml-auto" />
              </button>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm outline-none focus:border-primary-300 transition-colors"
                placeholder="닉네임 또는 이메일 검색..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {usersData?.items?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <Avatar src={u.profileImage} fallback={u.nickname} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{u.nickname}</p>
                      {u.role === 'ADMIN' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">관리자</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email} · 가입 {formatDate(u.createdAt)}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                    u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
                  )}>
                    {u.isActive ? '활성' : '비활성'}
                  </span>
                  <button
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0',
                      u.isActive
                        ? 'text-red-500 border-red-200 hover:bg-red-50'
                        : 'text-green-600 border-green-200 hover:bg-green-50',
                    )}
                  >
                    {u.isActive ? <><UserX className="h-3 w-3" /> 비활성화</> : <><Check className="h-3 w-3" /> 활성화</>}
                  </button>
                </div>
              ))}
              {usersData?.items?.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
              )}
            </div>
            {usersData && (
              <Pagination page={userPage} total={usersData.total} limit={10} onChange={setUserPage} />
            )}
          </div>
        )}

        {/* ── Crews ── */}
        {tab === 'crews' && (
          selectedCrew ? (
            <CrewDetail crew={selectedCrew} onBack={() => setSelectedCrew(null)} />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm outline-none focus:border-primary-300 transition-colors"
                  placeholder="크루 이름 검색..."
                  value={crewSearch}
                  onChange={(e) => { setCrewSearch(e.target.value); setCrewPage(1); }}
                />
              </div>

              <div className="space-y-2">
                {crewsData?.items?.map((c: any) => (
                  <div
                    key={c.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-primary-200 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCrew(c)}
                  >
                    <div className="flex items-center gap-4 px-4 py-3.5">
                      {/* 배너 이미지 있으면 사진, 없으면 아무것도 표시 안 함 */}
                      {c.bannerImage && (
                        <img
                          src={resolveUrl(c.bannerImage)}
                          alt={c.name}
                          className="h-12 w-12 rounded-xl object-cover shrink-0 border border-gray-100"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">
                            {c.name}
                          </span>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: c.themeColor + '1a', color: c.themeColor }}
                          >
                            {c.category}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {c.visibility === 'PUBLIC' ? '공개' : c.visibility === 'PASSWORD' ? '비밀번호' : '비공개'}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{c.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold" style={{ color: c.themeColor }}>
                            멤버 {c._count?.members ?? 0}/{c.maxMembers}명
                          </span>
                          <span className="text-xs text-gray-400">게시글 {c._count?.posts ?? 0}</span>
                          <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                        </div>
                      </div>

                      {/* Member count bar */}
                      <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-24">
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, ((c._count?.members ?? 0) / c.maxMembers) * 100)}%`,
                              background: c.themeColor,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {Math.round(((c._count?.members ?? 0) / c.maxMembers) * 100)}% 차있음
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCrew(c.id); }}
                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {crewsData?.items?.length === 0 && (
                  <p className="py-10 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
                    크루가 없습니다.
                  </p>
                )}
              </div>
              {crewsData && (
                <Pagination page={crewPage} total={crewsData.total} limit={10} onChange={setCrewPage} />
              )}
            </div>
          )
        )}

        {/* ── Reports ── */}
        {tab === 'reports' && (
          <div className="space-y-3">
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
              {(['PENDING', 'REVIEWED', 'DISMISSED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setReportStatus(s); setReportPage(1); }}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    reportStatus === s ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  )}
                  style={reportStatus === s ? { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' } : {}}
                >
                  {s === 'PENDING' ? `미처리 ${reportStatus === 'PENDING' && reportsData ? `(${reportsData.total})` : ''}` : s === 'REVIEWED' ? '처리됨' : '무시됨'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {reportsData?.items?.map((r: any) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{r.targetType}</span>
                        <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">
                          {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          r.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600'
                            : r.status === 'REVIEWED' ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-400',
                        )}>
                          {r.status === 'PENDING' ? '미처리' : r.status === 'REVIEWED' ? '처리됨' : '무시됨'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl px-3 py-2">
                        {r.message?.content || r.post?.content || r.comment?.content
                          || (r.targetType === 'USER' ? '유저 신고' : '—')}
                      </p>

                      {r.detail && (
                        <p className="text-xs text-gray-400 italic px-1">추가 설명: "{r.detail}"</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          신고자: <span className="font-medium text-gray-600">{r.reporter?.nickname}</span>
                        </span>
                        {r.targetUser && (
                          <span>
                            대상: <span className="font-medium text-gray-600">{r.targetUser.nickname}</span>
                            {r.targetUser.isActive === false && (
                              <span className="ml-1 text-red-400">(비활성)</span>
                            )}
                          </span>
                        )}
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {r.status === 'PENDING' && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
                      {r.targetUser && r.targetUser.isActive !== false && (
                        <button
                          onClick={() => deactivateUserFromReport(r.targetUser.id, r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <UserX className="h-3.5 w-3.5" /> 유저 비활성화
                        </button>
                      )}
                      <button
                        onClick={() => openNotifyModal(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <Bell className="h-3.5 w-3.5" /> 신고자에게 쪽지
                      </button>
                      <div className="flex gap-1.5 ml-auto">
                        <button
                          onClick={() => resolveReport(r.id, 'DISMISSED')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
                        >
                          <X className="h-3.5 w-3.5" /> 무시
                        </button>
                        <button
                          onClick={() => resolveReport(r.id, 'REVIEWED')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' }}
                        >
                          <Check className="h-3.5 w-3.5" /> 처리 완료
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {reportsData?.items?.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
                  {reportStatus === 'PENDING' ? '처리할 신고가 없습니다.' : '항목이 없습니다.'}
                </p>
              )}
            </div>
            {reportsData && (
              <Pagination page={reportPage} total={reportsData.total} limit={10} onChange={setReportPage} />
            )}
          </div>
        )}

          </div>{/* Content */}
        </div>{/* White card */}
      </div>

      {/* 쪽지 모달 */}
      {notifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">신고자에게 쪽지 보내기</h3>
              <button onClick={() => setNotifyModal(null)} className="h-7 w-7 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">작성한 메시지가 신고자의 알림함으로 전달됩니다.</p>
            <textarea
              className="input-field resize-none w-full"
              rows={4}
              placeholder="신고자에게 전달할 메시지를 입력하세요"
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setNotifyModal(null)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">취소</button>
              <button
                onClick={sendNotify}
                disabled={!notifyMessage.trim()}
                className="flex-1 py-2.5 rounded-2xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
