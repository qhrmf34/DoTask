'use client';

import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Crown, Shield, User, X, ThumbsUp, ThumbsDown, MessageCircle, ChevronLeft, ChevronRight, MoreHorizontal, UserMinus, Trash2, LogOut, ShieldCheck, ShieldOff, Flag, Copy, Check, Settings, Camera, RefreshCw } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useDialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; nickname: string; profileImage?: string; bio?: string };
}

interface TodoReaction { type: 'LIKE' | 'DISLIKE'; userId: string }
interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  category?: { id: string; name: string; color: string };
  _count: { comments: number; reactions: number };
  reactions: TodoReaction[];
}

function TodoRow({
  todo, meId, expandedTodo, commentText, comments, loadingComments, onReact, onToggleComments, onComment, onCommentChange,
}: {
  todo: Todo;
  meId?: string;
  expandedTodo: string | null;
  commentText: Record<string, string>;
  comments: Record<string, any[]>;
  loadingComments: string | null;
  onReact: (id: string, type: 'LIKE' | 'DISLIKE') => void;
  onToggleComments: (id: string) => void;
  onComment: (id: string) => void;
  onCommentChange: (id: string, value: string) => void;
}) {
  const myLike = todo.reactions.find((r) => r.userId === meId && r.type === 'LIKE');
  const myDislike = todo.reactions.find((r) => r.userId === meId && r.type === 'DISLIKE');
  const likes = todo.reactions.filter((r) => r.type === 'LIKE').length;
  const dislikes = todo.reactions.filter((r) => r.type === 'DISLIKE').length;
  const isExpanded = expandedTodo === todo.id;

  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white p-3 space-y-2', todo.isCompleted && 'opacity-55')}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
          todo.isCompleted ? 'bg-violet-500 border-primary-500' : 'border-gray-300',
        )}>
          {todo.isCompleted && <span className="text-white text-[8px] font-bold">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm text-gray-800 leading-snug', todo.isCompleted && 'line-through text-gray-400')}>
            {todo.title}
          </p>
          {todo.category && (
            <span className="inline-block text-[11px] px-1.5 py-0.5 rounded-full mt-1 font-medium"
              style={{ backgroundColor: todo.category.color + '18', color: todo.category.color }}>
              {todo.category.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 pl-6">
        <button
          onClick={() => onReact(todo.id, 'LIKE')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
            myLike ? 'bg-violet-50 text-primary-600 font-medium' : 'text-gray-400 hover:bg-gray-50',
          )}
        >
          <ThumbsUp className="h-3 w-3" /> {likes}
        </button>
        <button
          onClick={() => onReact(todo.id, 'DISLIKE')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
            myDislike ? 'bg-red-50 text-red-500 font-medium' : 'text-gray-400 hover:bg-gray-50',
          )}
        >
          <ThumbsDown className="h-3 w-3" /> {dislikes}
        </button>
        <button
          onClick={() => onToggleComments(todo.id)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
            isExpanded ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50',
          )}
        >
          <MessageCircle className="h-3 w-3" />
          {todo._count.comments > 0 ? todo._count.comments : ''} 댓글
        </button>
      </div>
      {isExpanded && (
        <div className="pl-6 space-y-2 pt-1.5 border-t border-gray-50">
          {loadingComments === todo.id ? (
            <p className="text-xs text-gray-400">불러오는 중...</p>
          ) : (comments[todo.id] ?? []).length === 0 ? (
            <p className="text-xs text-gray-400">댓글이 없습니다.</p>
          ) : (
            (comments[todo.id] ?? []).map((c: any) => (
              <div key={c.id} className="flex items-start gap-1.5">
                <Avatar src={c.user?.profileImage} fallback={c.user?.nickname ?? '?'} size="xs" />
                <div className="flex-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-gray-700">{c.user?.nickname}</span>
                  <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-1.5">
            <input
              className="input-field flex-1 text-xs py-1.5"
              placeholder="댓글..."
              value={commentText[todo.id] ?? ''}
              onChange={(e) => onCommentChange(todo.id, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onComment(todo.id)}
            />
            <button
              onClick={() => onComment(todo.id)}
              disabled={!commentText[todo.id]?.trim()}
              className="px-2.5 py-1.5 bg-violet-500 text-white rounded-xl text-xs hover:bg-primary-600 disabled:opacity-40"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const roleConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  OWNER: { icon: <Crown className="h-3 w-3" />, label: '오너', bg: 'bg-amber-50', text: 'text-amber-600' },
  ADMIN: { icon: <Shield className="h-3 w-3" />, label: '관리자', bg: 'bg-blue-50', text: 'text-blue-600' },
  MEMBER: { icon: <User className="h-3 w-3" />, label: '멤버', bg: 'bg-gray-100', text: 'text-gray-500' },
};

function formatDateKr(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function MemberTodosPanel({
  crewId, member, onClose,
}: {
  crewId: string; member: Member; onClose: () => void;
}) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [date, setDate] = useState(formatDateKr(new Date()));
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ['member-todos', crewId, member.user.id, date],
    queryFn: () => api.get(`/crews/${crewId}/members/${member.user.id}/todos?date=${date}`).then((r) => r.data),
    enabled: !!date,
  });

  const changeDate = (offset: number) => {
    const parts = date.split('.');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    d.setDate(d.getDate() + offset);
    setDate(formatDateKr(d));
  };

  const handleReact = async (todoId: string, type: 'LIKE' | 'DISLIKE') => {
    try {
      await api.post(`/todos/${todoId}/reactions`, { type });
      qc.invalidateQueries({ queryKey: ['member-todos', crewId, member.user.id, date] });
    } catch {}
  };

  const toggleComments = async (todoId: string) => {
    if (expandedTodo === todoId) { setExpandedTodo(null); return; }
    setExpandedTodo(todoId);
    if (!comments[todoId]) {
      setLoadingComments(todoId);
      try {
        const res = await api.get(`/todos/${todoId}/comments`);
        setComments((prev) => ({ ...prev, [todoId]: res.data?.items ?? res.data ?? [] }));
      } catch {}
      setLoadingComments(null);
    }
  };

  const handleComment = async (todoId: string) => {
    const text = commentText[todoId]?.trim();
    if (!text) return;
    try {
      await api.post(`/todos/${todoId}/comments`, { content: text });
      setCommentText((prev) => ({ ...prev, [todoId]: '' }));
      const res = await api.get(`/todos/${todoId}/comments`);
      setComments((prev) => ({ ...prev, [todoId]: res.data?.items ?? res.data ?? [] }));
    } catch {}
  };

  const pending = todos.filter((t) => !t.isCompleted);
  const completed = todos.filter((t) => t.isCompleted);
  const doneCount = completed.length;
  const totalCount = todos.length;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const rc = roleConfig[member.role] ?? roleConfig.MEMBER;

  return (
    <div className="flex flex-col h-full w-80 shrink-0" style={{ background: '#f7f8fa', borderLeft: '1px solid #e8e4f8' }}>
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar src={member.user.profileImage} fallback={member.user.nickname} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 truncate">{member.user.nickname}</p>
              <span className={cn('flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full', rc.bg, rc.text)}>
                {rc.icon} {rc.label}
              </span>
            </div>
            {member.user.bio && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{member.user.bio}</p>
            )}
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">오늘 달성률</span>
              <span className={cn('text-xs font-bold', pct === 100 ? 'text-green-500' : 'text-violet-500')}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-400' : 'bg-primary-400')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <button onClick={() => changeDate(-1)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700">{date}</span>
        <button onClick={() => changeDate(1)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2" style={{ background: '#f7f8fa' }}>
        {todos.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">할일이 없습니다</p>
          </div>
        ) : (
          <>
            {pending.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                meId={me?.id}
                expandedTodo={expandedTodo}
                commentText={commentText}
                comments={comments}
                loadingComments={loadingComments}
                onReact={handleReact}
                onToggleComments={toggleComments}
                onComment={handleComment}
                onCommentChange={(id, val) => setCommentText((prev) => ({ ...prev, [id]: val }))}
              />
            ))}
            {completed.length > 0 && (
              <div className="pt-1">
                <p className="text-xs text-gray-400 px-1 mb-2">완료 {completed.length}개</p>
                {completed.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    meId={me?.id}
                    expandedTodo={expandedTodo}
                    commentText={commentText}
                    comments={comments}
                    loadingComments={loadingComments}
                    onReact={handleReact}
                    onToggleComments={toggleComments}
                    onComment={handleComment}
                    onCommentChange={(id, val) => setCommentText((prev) => ({ ...prev, [id]: val }))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MembersPage({ params }: { params: { crewId: string } }) {
  const { crewId } = params;
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { confirm } = useDialog();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModal, setReportModal] = useState<{ userId: string; nickname: string } | null>(null);
  const [reportReason, setReportReason] = useState('INAPPROPRIATE');
  const [reportDetail, setReportDetail] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editBannerRef = useRef<HTMLInputElement>(null);

  const REPORT_REASONS = [
    { value: 'SPAM', label: '스팸 / 홍보' },
    { value: 'ABUSE', label: '욕설 / 비방' },
    { value: 'HATE', label: '혐오 / 차별' },
    { value: 'INAPPROPRIATE', label: '부적절한 행동' },
    { value: 'OTHER', label: '기타' },
  ];

  const handleReport = (m: Member) => {
    setMenuOpen(null);
    setReportReason('INAPPROPRIATE');
    setReportDetail('');
    setReportModal({ userId: m.user.id, nickname: m.user.nickname });
  };

  const submitReport = async () => {
    if (!reportModal) return;
    await api.post(`/users/${reportModal.userId}/report`, { reason: reportReason, detail: reportDetail || undefined }).catch(() => {});
    setReportModal(null);
    await confirm({ title: '신고 완료', message: '신고가 접수되었습니다.', confirmText: '확인', type: 'alert' });
  };

  const { data: crew } = useQuery<{ id: string; name: string; description?: string; category: string; visibility: string; inviteCode?: string; bannerImage?: string }>({
    queryKey: ['crew', crewId],
    queryFn: () => api.get(`/crews/${crewId}`).then((r) => r.data),
  });

  const { data: members = [], refetch } = useQuery<Member[]>({
    queryKey: ['crew-members', crewId],
    queryFn: () => api.get(`/crews/${crewId}/members`).then((r) => r.data),
  });

  const myMember = members.find((m) => m.user.id === me?.id);
  const myRole = myMember?.role;
  const isOwner = myRole === 'OWNER';
  const isAdmin = myRole === 'ADMIN';

  const sorted = [...members].sort((a, b) => {
    const order = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
    return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3);
  });

  const handleTransferOwnership = async (m: Member) => {
    const ok = await confirm({
      title: '방장 넘기기',
      message: `${m.user.nickname}님에게 방장을 넘길까요?\n넘기면 본인은 부방장이 됩니다.`,
      confirmText: '넘기기',
      cancelText: '취소',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api.patch(`/crews/${crewId}/transfer/${m.user.id}`);
      setMenuOpen(null);
      refetch();
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '방장 넘기기에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  const handleSetRole = async (m: Member, role: 'ADMIN' | 'MEMBER') => {
    const label = role === 'ADMIN' ? '부방장' : '일반 멤버';
    const ok = await confirm({
      title: role === 'ADMIN' ? '부방장 임명' : '부방장 해제',
      message: `${m.user.nickname}님을 ${label}로 변경할까요?`,
      confirmText: '변경',
      cancelText: '취소',
      type: 'alert',
    });
    if (!ok) return;
    try {
      await api.patch(`/crews/${crewId}/members/${m.user.id}`, { role });
      setMenuOpen(null);
      refetch();
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '변경에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  const handleKick = async (m: Member) => {
    const ok = await confirm({
      title: '멤버 강퇴',
      message: `${m.user.nickname}님을 크루에서 강퇴할까요?`,
      confirmText: '강퇴',
      cancelText: '취소',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/crews/${crewId}/members/${m.user.id}`);
      if (selectedMember?.id === m.id) setSelectedMember(null);
      setMenuOpen(null);
      refetch();
      qc.invalidateQueries({ queryKey: ['crew-today-stats', crewId] });
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '강퇴에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  const handleCopyInvite = () => {
    if (!crew?.inviteCode) return;
    const link = `${window.location.origin}/crews/invite/${crew.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    });
  };

  const openEditModal = () => {
    if (!crew) return;
    setEditName(crew.name);
    setEditDesc(crew.description ?? '');
    setEditCategory(crew.category);
    setEditBannerPreview(null);
    setEditBannerFile(null);
    setEditModal(true);
  };

  const handleEditBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditBannerFile(file);
    setEditBannerPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const form = new FormData();
      form.append('name', editName);
      form.append('description', editDesc);
      form.append('category', editCategory);
      if (editBannerFile) form.append('banner', editBannerFile);
      await api.patch(`/crews/${crewId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['crew', crewId] });
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      setEditModal(false);
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '수정에 실패했습니다.', confirmText: '확인', type: 'alert' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleLeave = async () => {
    const ok = await confirm({
      title: '크루 탈퇴',
      message: '정말 크루에서 탈퇴할까요?',
      confirmText: '탈퇴',
      cancelText: '취소',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/crews/${crewId}/leave`);
      qc.removeQueries({ queryKey: ['my-crews'] });
      qc.removeQueries({ queryKey: ['crew', crewId] });
      router.push('/crews');
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '탈퇴에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  const handleDeleteCrew = async () => {
    const ok = await confirm({
      title: '크루 삭제',
      message: '크루를 삭제하면 되돌릴 수 없습니다. 정말 삭제할까요?',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/crews/${crewId}`);
      qc.removeQueries({ queryKey: ['my-crews'] });
      qc.removeQueries({ queryKey: ['crews'] });
      qc.removeQueries({ queryKey: ['crew', crewId] });
      router.push('/crews');
    } catch (e: any) {
      await confirm({ title: '오류', message: e?.response?.data?.message ?? '삭제에 실패했습니다.', confirmText: '확인', type: 'alert' });
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Member list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #e8e8e8' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl" style={{ borderBottom: '1px solid #eeeeee' }}>
              <div>
                <h2 className="text-base font-bold text-gray-900">멤버</h2>
                <p className="text-xs text-gray-400 mt-0.5">{members.length}명</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end items-center">
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    await refetch();
                    setTimeout(() => setRefreshing(false), 600);
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {myMember && crew?.visibility === 'PRIVATE' && (
                  <button
                    onClick={handleCopyInvite}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-violet-50 transition-colors"
                  >
                    {copiedInvite ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedInvite ? '복사됨' : '초대링크'}
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" /> 크루 수정
                  </button>
                )}
                {isOwner ? (
                  <button
                    onClick={handleDeleteCrew}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 크루 삭제
                  </button>
                ) : myMember ? (
                  <button
                    onClick={handleLeave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> 탈퇴
                  </button>
                ) : null}
              </div>
            </div>

            {/* Member rows */}
            <div className="divide-y divide-gray-50">
              {sorted.map((m) => {
                const canKick = (isOwner || isAdmin) && m.user.id !== me?.id && m.role !== 'OWNER' && !(isAdmin && m.role === 'ADMIN');
                const canManageRole = isOwner && m.user.id !== me?.id && m.role !== 'OWNER';
                const canTransfer = isOwner && m.user.id !== me?.id && m.role !== 'OWNER';
                const canReport = m.user.id !== me?.id;
                const hasMenu = canKick || canManageRole || canTransfer || canReport;
                const isMenuOpen = menuOpen === m.id;
                const rc = roleConfig[m.role] ?? roleConfig.MEMBER;
                const isSelected = selectedMember?.id === m.id;

                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center transition-colors last:rounded-b-2xl',
                      isSelected ? 'bg-violet-50/40' : 'hover:bg-gray-50',
                    )}
                  >
                    <button
                      onClick={() => setSelectedMember(isSelected ? null : m)}
                      className="flex flex-1 items-center gap-3 px-5 py-3.5 text-left"
                    >
                      <Avatar src={m.user.profileImage} fallback={m.user.nickname} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{m.user.nickname}</span>
                          <span className={cn('flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0', rc.bg, rc.text)}>
                            {rc.icon} {rc.label}
                          </span>
                        </div>
                        {m.user.bio && (
                          <p className="text-xs text-gray-400 truncate">{m.user.bio}</p>
                        )}
                      </div>
                    </button>

                    {hasMenu && (
                      <div className="pr-4 relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : m.id); }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[130px]">
                            {canManageRole && m.role !== 'ADMIN' && (
                              <button onClick={() => handleSetRole(m, 'ADMIN')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                                <ShieldCheck className="h-3.5 w-3.5" /> 부방장 임명
                              </button>
                            )}
                            {canManageRole && m.role === 'ADMIN' && (
                              <button onClick={() => handleSetRole(m, 'MEMBER')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                <ShieldOff className="h-3.5 w-3.5" /> 부방장 해제
                              </button>
                            )}
                            {canTransfer && (
                              <button onClick={() => handleTransferOwnership(m)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                                <Crown className="h-3.5 w-3.5" /> 방장 넘기기
                              </button>
                            )}
                            {canKick && (
                              <button onClick={() => handleKick(m)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                                <UserMinus className="h-3.5 w-3.5" /> 강퇴
                              </button>
                            )}
                            {canReport && (
                              <button onClick={() => handleReport(m)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-50">
                                <Flag className="h-3.5 w-3.5" /> 신고
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Member todos panel */}
      {selectedMember && (
        <MemberTodosPanel
          crewId={crewId}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* 크루 수정 모달 */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* 배너 영역 */}
            <div
              className="relative h-32 bg-gray-100 cursor-pointer group flex items-center justify-center overflow-hidden"
              onClick={() => editBannerRef.current?.click()}
            >
              {editBannerPreview || crew?.bannerImage ? (
                <img
                  src={editBannerPreview ?? (crew?.bannerImage ? `/uploads/${crew.bannerImage.split('/uploads/')[1] ?? crew.bannerImage}` : '')}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">배너 변경 (선택)</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <input ref={editBannerRef} type="file" accept="image/*" className="hidden" onChange={handleEditBanner} />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">크루 수정</h3>
                <button onClick={() => setEditModal(false)} className="h-7 w-7 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                className="input-field w-full text-sm"
                placeholder="크루 이름"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div className="relative">
                <textarea
                  className="input-field w-full text-sm resize-none"
                  rows={2}
                  maxLength={200}
                  placeholder="크루 소개 (선택)"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
                <span className={cn(
                  'absolute bottom-2 right-2.5 text-[11px] tabular-nums',
                  editDesc.length >= 180 ? 'text-red-400' : 'text-gray-300',
                )}>
                  {editDesc.length}/200
                </span>
              </div>
              {/* 카테고리 */}
              <div className="flex flex-wrap gap-1.5">
                {(['Study','Sports','Hobby','Work','Game','Other'] as const).map((c) => {
                  const labels: Record<string,string> = { Study:'공부', Sports:'스포츠', Hobby:'취미', Work:'업무', Game:'게임', Other:'기타' };
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditCategory(c)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        editCategory === c ? 'bg-violet-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {labels[c]}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditModal(false)} className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">취소</button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-violet-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  {editSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">{reportModal.nickname} 신고</h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors border',
                    reportReason === r.value
                      ? 'bg-violet-50 border-primary-300 text-primary-700'
                      : 'border-gray-100 text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm resize-none outline-none focus:border-primary-300"
              rows={2}
              placeholder="추가 설명 (선택)"
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setReportModal(null)}
                className="flex-1 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-2xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={submitReport}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-2xl"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' }}
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
