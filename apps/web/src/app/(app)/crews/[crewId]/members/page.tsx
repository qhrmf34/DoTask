'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Crown, Shield, User, X, ThumbsUp, ThumbsDown, MessageCircle, ChevronLeft, ChevronRight, MoreHorizontal, UserMinus, Trash2, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
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

const roleIcon: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-3.5 w-3.5 text-amber-500" />,
  ADMIN: <Shield className="h-3.5 w-3.5 text-blue-500" />,
  MEMBER: <User className="h-3.5 w-3.5 text-gray-400" />,
};

const roleLabel: Record<string, string> = {
  OWNER: '오너',
  ADMIN: '관리자',
  MEMBER: '멤버',
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

  const TodoRow = ({ todo }: { todo: Todo }) => {
    const myLike = todo.reactions.find((r) => r.userId === me?.id && r.type === 'LIKE');
    const myDislike = todo.reactions.find((r) => r.userId === me?.id && r.type === 'DISLIKE');
    const likes = todo.reactions.filter((r) => r.type === 'LIKE').length;
    const dislikes = todo.reactions.filter((r) => r.type === 'DISLIKE').length;
    const isExpanded = expandedTodo === todo.id;

    return (
      <div className={cn('border border-gray-100 rounded-xl p-3 space-y-2', todo.isCompleted && 'opacity-60')}>
        <div className="flex items-start gap-2">
          <div className={cn('mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
            todo.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300')}>
            {todo.isCompleted && <span className="text-white text-[8px] font-bold">✓</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm text-gray-800', todo.isCompleted && 'line-through text-gray-400')}>{todo.title}</p>
            {todo.category && (
              <span className="inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: todo.category.color + '20', color: todo.category.color }}>
                {todo.category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 pl-6">
          <button onClick={() => handleReact(todo.id, 'LIKE')}
            className={cn('flex items-center gap-1 text-xs transition-colors', myLike ? 'text-primary-500 font-medium' : 'text-gray-400 hover:text-primary-400')}>
            <ThumbsUp className="h-3.5 w-3.5" /> {likes}
          </button>
          <button onClick={() => handleReact(todo.id, 'DISLIKE')}
            className={cn('flex items-center gap-1 text-xs transition-colors', myDislike ? 'text-red-400 font-medium' : 'text-gray-400 hover:text-red-300')}>
            <ThumbsDown className="h-3.5 w-3.5" /> {dislikes}
          </button>
          <button onClick={() => toggleComments(todo.id)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <MessageCircle className="h-3.5 w-3.5" />
            {todo._count.comments > 0 ? todo._count.comments : ''} 댓글
          </button>
        </div>
        {isExpanded && (
          <div className="pl-6 space-y-2 pt-1 border-t border-gray-50">
            {loadingComments === todo.id ? (
              <p className="text-xs text-gray-400">불러오는 중...</p>
            ) : (comments[todo.id] ?? []).length === 0 ? (
              <p className="text-xs text-gray-400">댓글이 없습니다.</p>
            ) : (
              (comments[todo.id] ?? []).map((c: any) => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <Avatar src={c.user?.profileImage} fallback={c.user?.nickname ?? '?'} size="xs" />
                  <div className="flex-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs font-medium text-gray-700">{c.user?.nickname}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2">
              <input className="input-field flex-1 text-xs py-1.5" placeholder="댓글..."
                value={commentText[todo.id] ?? ''}
                onChange={(e) => setCommentText((prev) => ({ ...prev, [todo.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleComment(todo.id)} />
              <button onClick={() => handleComment(todo.id)} disabled={!commentText[todo.id]?.trim()}
                className="px-2.5 py-1.5 bg-primary-500 text-white rounded-lg text-xs hover:bg-primary-600 disabled:opacity-40">
                전송
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 w-80 shrink-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Avatar src={member.user.profileImage} fallback={member.user.nickname} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{member.user.nickname}</p>
          <p className="text-xs text-gray-400">{roleLabel[member.role]}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <span className="text-xs font-medium text-gray-700">{date}</span>
        <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
        {todos.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400"><p>할일이 없습니다</p></div>
        ) : (
          <>
            {pending.map((todo) => <TodoRow key={todo.id} todo={todo} />)}
            {completed.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-2">완료 ({completed.length})</p>
                {completed.map((todo) => <TodoRow key={todo.id} todo={todo} />)}
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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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

  const handleKick = async (m: Member) => {
    if (!confirm(`${m.user.nickname}님을 강퇴할까요?`)) return;
    try {
      await api.delete(`/crews/${crewId}/members/${m.user.id}`);
      if (selectedMember?.id === m.id) setSelectedMember(null);
      setMenuOpen(null);
      refetch();
      qc.invalidateQueries({ queryKey: ['crew-today-stats', crewId] });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '강퇴에 실패했습니다.');
    }
  };

  const handleLeave = async () => {
    if (!confirm('크루에서 탈퇴할까요?')) return;
    try {
      await api.delete(`/crews/${crewId}/leave`);
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      router.push('/crews');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '탈퇴에 실패했습니다.');
    }
  };

  const handleDeleteCrew = async () => {
    if (!confirm('크루를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await api.delete(`/crews/${crewId}`);
      qc.invalidateQueries({ queryKey: ['my-crews'] });
      router.push('/crews');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Member list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">멤버 {members.length}명</h2>
            {/* 내 액션 버튼 */}
            <div className="flex gap-2">
              {isOwner ? (
                <button
                  onClick={handleDeleteCrew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 크루 삭제
                </button>
              ) : myMember ? (
                <button
                  onClick={handleLeave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> 탈퇴
                </button>
              ) : null}
            </div>
          </div>

          <div className="card divide-y divide-gray-100">
            {sorted.map((m) => {
              const canKick = (isOwner || isAdmin) && m.user.id !== me?.id && m.role !== 'OWNER';
              const isMenuOpen = menuOpen === m.id;

              return (
                <div key={m.id} className="relative flex items-center">
                  <button
                    onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                    className={cn(
                      'flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      selectedMember?.id === m.id && 'bg-primary-50',
                    )}
                  >
                    <Avatar src={m.user.profileImage} fallback={m.user.nickname} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900">{m.user.nickname}</span>
                        {roleIcon[m.role]}
                      </div>
                      {m.user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{m.user.bio}</p>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full shrink-0',
                      m.role === 'OWNER' ? 'bg-amber-50 text-amber-600'
                      : m.role === 'ADMIN' ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500',
                    )}>
                      {roleLabel[m.role]}
                    </span>
                  </button>

                  {/* 강퇴 메뉴 */}
                  {canKick && (
                    <div className="pr-3 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : m.id); }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[110px]">
                          <button
                            onClick={() => handleKick(m)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                          >
                            <UserMinus className="h-3.5 w-3.5" /> 강퇴
                          </button>
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

      {/* Member todos panel */}
      {selectedMember && (
        <MemberTodosPanel
          crewId={crewId}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
