'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ChevronDown, Sparkles, ThumbsUp, ThumbsDown, MessageCircle, Send, X, Flag } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface Category { id: string; name: string; color: string }
interface Reaction { type: 'LIKE' | 'DISLIKE'; userId: string }
interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  category?: Category;
  _count?: { comments: number; reactions: number };
  reactions?: Reaction[];
}
interface Props { todos: Todo[]; onRefetch: () => void; date: string }

const PRESET_COLORS = ['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export function TodoList({ todos, onRefetch, date }: Props) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['todo-categories'],
    queryFn: () => api.get('/todo-categories').then((r) => r.data).catch(() => []),
  });

  const selectedCat = categories.find((c) => c.id === newCategoryId);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await api.post('/todo-categories', { name: newCatName.trim(), color: newCatColor });
      qc.invalidateQueries({ queryKey: ['todo-categories'] });
      setCreatingCat(false);
      setNewCatName('');
    } catch {}
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/todo-categories/${id}`);
      if (newCategoryId === id) setNewCategoryId(null);
      qc.invalidateQueries({ queryKey: ['todo-categories'] });
    } catch {}
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post('/todos', {
        title: newTitle.trim(),
        dueDate: date,
        ...(newCategoryId ? { categoryId: newCategoryId } : {}),
      });
      setNewTitle(''); setNewCategoryId(null); setAdding(false); setShowCatPicker(false);
      onRefetch();
      qc.invalidateQueries({ queryKey: ['todos-monthly-stats'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['crew-today-stats'] });
    } catch {}
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/todos/${id}/complete`);
      onRefetch();
      qc.invalidateQueries({ queryKey: ['todos-monthly-stats'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['crew-today-stats'] });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/todos/${id}`);
      onRefetch();
      qc.invalidateQueries({ queryKey: ['todos-monthly-stats'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['crew-today-stats'] });
    } catch {}
  };

  const pending = todos.filter((t) => !t.isCompleted);
  const completed = todos.filter((t) => t.isCompleted);

  return (
    <div className="space-y-2">
      {/* Add button / form */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-3xl border-2 border-dashed border-primary-200 text-primary-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/40 transition-all group"
        >
          <div className="h-6 w-6 rounded-full border-2 border-dashed border-primary-300 group-hover:border-primary-500 flex items-center justify-center transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">할일 추가하기</span>
          <Sparkles className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ) : (
        <div className="card p-4 space-y-3" style={{ borderColor: '#c4b5fd', boxShadow: '0 4px 20px rgba(139,92,246,0.12)' }}>
          {/* Category picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowCatPicker((v) => !v); setCreatingCat(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-2xl border border-primary-100 bg-cream-100 text-sm hover:border-primary-300 transition-colors"
            >
              {selectedCat ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedCat.color }} />
                  <span className="flex-1 text-left text-sm text-gray-700">{selectedCat.name}</span>
                </>
              ) : (
                <span className="flex-1 text-left text-sm text-gray-400">카테고리 없음</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showCatPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 w-full bg-white border border-primary-100 rounded-3xl shadow-soft overflow-hidden">
                <button
                  onClick={() => { setNewCategoryId(null); setShowCatPicker(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-primary-50"
                >
                  없음
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="group flex items-center hover:bg-primary-50">
                    <button
                      onClick={() => { setNewCategoryId(cat.id); setShowCatPicker(false); }}
                      className="flex items-center gap-2.5 flex-1 px-4 py-2.5 text-sm text-gray-700"
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(e, cat.id)}
                      className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {!creatingCat ? (
                  <button onClick={() => setCreatingCat(true)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 border-t border-primary-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> 새 카테고리
                  </button>
                ) : (
                  <div className="p-4 border-t border-primary-100 space-y-2.5">
                    <input autoFocus className="input-field text-sm py-2"
                      placeholder="카테고리 이름"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setNewCatColor(c)}
                          className={cn('h-5 w-5 rounded-full transition-all', newCatColor === c && 'ring-2 ring-offset-2 ring-primary-400 scale-110')}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateCategory}
                        className="flex-1 py-1.5 bg-primary-500 text-white rounded-2xl text-xs font-semibold hover:bg-primary-600 transition-colors">
                        만들기
                      </button>
                      <button onClick={() => setCreatingCat(false)}
                        className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs">취소</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            autoFocus={!showCatPicker}
            className="input-field text-sm"
            placeholder="할일을 입력하세요"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showCatPicker) handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }
            }}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 py-2.5 bg-primary-500 text-white text-sm font-bold rounded-2xl hover:bg-primary-600 transition-colors shadow-sm">
              추가하기
            </button>
            <button onClick={() => { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && !adding && (
        <div className="card py-12 text-center flex flex-col items-center gap-2">
          <div className="mascot-float">
            <img src="/mascot/mascot_waiting.png" alt="" style={{ height: 130, width: 'auto', objectFit: 'contain' }} />
          </div>
          <p className="text-sm font-bold mt-1" style={{ color: '#6d28d9' }}>오늘은 할일이 없어요!</p>
          <p className="text-xs text-gray-400">토리가 기다리고 있어요</p>
        </div>
      )}

      {/* All done state */}
      {todos.length > 0 && pending.length === 0 && (
        <div className="card py-8 text-center flex flex-col items-center gap-1.5">
          <div className="hover-wiggle">
            <img src="/mascot/mascot_happy.png" alt="" style={{ height: 130, width: 'auto', objectFit: 'contain' }} />
          </div>
          <p className="text-sm font-bold" style={{ color: '#6d28d9' }}>모든 할일 완료!</p>
          <p className="text-xs text-gray-400">토리가 기뻐하고 있어요</p>
        </div>
      )}

      {/* Pending todos */}
      {pending.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #f5f3ff' }}>
            <span className="text-xs font-bold text-primary-400">진행 중 · {pending.length}개</span>
          </div>
          <div>
            {pending.map((todo, i) => (
              <div key={todo.id} style={i > 0 ? { borderTop: '1px solid #f5f3ff' } : {}}>
                <TodoItem todo={todo} onToggle={handleToggle} onDelete={handleDelete} onRefetch={onRefetch} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed todos */}
      {completed.length > 0 && (
        <div className="card overflow-hidden opacity-80">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f5f3ff' }}>
            <span className="text-xs font-bold text-gray-400">완료 · {completed.length}개</span>
            <div className="flex-1 h-px bg-primary-100" />
          </div>
          <div>
            {completed.map((todo, i) => (
              <div key={todo.id} style={i > 0 ? { borderTop: '1px solid #f5f3ff' } : {}}>
                <TodoItem todo={todo} onToggle={handleToggle} onDelete={handleDelete} onRefetch={onRefetch} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, onRefetch }: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRefetch: () => void;
}) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  const myReaction = todo.reactions?.find((r) => r.userId === me?.id);
  const likes = todo.reactions?.filter((r) => r.type === 'LIKE').length ?? 0;
  const dislikes = todo.reactions?.filter((r) => r.type === 'DISLIKE').length ?? 0;
  const commentCount = todo._count?.comments ?? 0;

  const hasActivity = likes > 0 || dislikes > 0 || commentCount > 0;

  const handleReact = async (type: 'LIKE' | 'DISLIKE') => {
    await api.post(`/todos/${todo.id}/reactions`, { type }).catch(() => {});
    onRefetch();
    qc.invalidateQueries({ queryKey: ['todos-monthly-stats'] });
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/todos/${todo.id}/comments`);
        setComments(res.data?.items ?? res.data ?? []);
      } catch {}
      setLoadingComments(false);
    }
    setShowComments((v) => !v);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/todos/${todo.id}/comments`, { content: commentText.trim() });
      setCommentText('');
      const res = await api.get(`/todos/${todo.id}/comments`);
      setComments(res.data?.items ?? res.data ?? []);
      onRefetch();
    } catch {}
  };

  const handleDeleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`).catch(() => {});
    const res = await api.get(`/todos/${todo.id}/comments`);
    setComments(res.data?.items ?? res.data ?? []);
    onRefetch();
  };

  const handleReportComment = async () => {
    if (!reportCommentId || !reportReason) return;
    await api.post(`/comments/${reportCommentId}/report`, { reason: reportReason, detail: reportDetail }).catch(() => {});
    setReportCommentId(null);
    setReportReason('');
    setReportDetail('');
  };

  const REPORT_REASONS = [
    { value: 'SPAM', label: '스팸 / 홍보' },
    { value: 'ABUSE', label: '욕설 / 비방' },
    { value: 'HATE', label: '혐오 / 차별' },
    { value: 'INAPPROPRIATE', label: '부적절한 내용' },
    { value: 'OTHER', label: '기타' },
  ];

  return (
    <div className={cn('group relative transition-colors hover:bg-primary-50/50')}>
      {/* Category color bar */}
      {todo.category && !todo.isCompleted && (
        <div
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
          style={{ backgroundColor: todo.category.color }}
        />
      )}

      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={cn(
            'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
            todo.isCompleted
              ? 'bg-primary-500 border-primary-500 scale-95'
              : 'border-primary-300 hover:border-primary-500 hover:bg-primary-50',
          )}
        >
          {todo.isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm leading-snug',
            todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 font-medium',
          )}>
            {todo.title}
          </p>
          {todo.category && (
            <span
              className="inline-block text-[11px] px-2 py-0.5 rounded-full mt-0.5 font-semibold"
              style={{ backgroundColor: todo.category.color + '18', color: todo.category.color }}
            >
              {todo.category.name}
            </span>
          )}
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1.5 rounded-xl hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Reactions + comments bar — 활동 있거나 hover 시 표시 */}
      {(hasActivity || true) && (
        <div className="flex items-center gap-0.5 px-4 pb-2.5 -mt-1">
          <button
            onClick={() => handleReact('LIKE')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
              myReaction?.type === 'LIKE'
                ? 'bg-primary-50 text-primary-600 font-semibold'
                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50',
            )}
          >
            <ThumbsUp className="h-3 w-3" />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button
            onClick={() => handleReact('DISLIKE')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
              myReaction?.type === 'DISLIKE'
                ? 'bg-red-50 text-red-500 font-semibold'
                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50',
            )}
          >
            <ThumbsDown className="h-3 w-3" />
            {dislikes > 0 && <span>{dislikes}</span>}
          </button>
          <button
            onClick={toggleComments}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
              showComments
                ? 'bg-gray-100 text-gray-600 font-semibold'
                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50',
            )}
          >
            <MessageCircle className="h-3 w-3" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
        </div>
      )}

      {/* Comment report modal */}
      {reportCommentId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">댓글 신고</h3>
              <button onClick={() => setReportCommentId(null)} className="h-6 w-6 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <button key={r.value} onClick={() => setReportReason(r.value)}
                  className={cn('w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                    reportReason === r.value ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-600 hover:border-primary-200')}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea className="input-field resize-none text-xs w-full" rows={2} placeholder="추가 설명 (선택)"
              value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setReportCommentId(null)} className="flex-1 py-2 rounded-2xl border border-gray-200 text-xs text-gray-500">취소</button>
              <button onClick={handleReportComment} disabled={!reportReason}
                className="flex-1 py-2 rounded-2xl bg-red-500 text-white text-xs font-semibold disabled:opacity-40">신고하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid #f5f3ff' }}>
          <div className="pt-2 space-y-1.5">
            {loadingComments ? (
              <p className="text-xs text-gray-400 py-1">불러오는 중...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">첫 댓글을 남겨보세요.</p>
            ) : (
              comments.map((c: any) => {
                const isMyComment = c.user?.id === me?.id;
                return (
                  <div key={c.id} className="flex items-start gap-2 group/cmt">
                    <Avatar src={c.user?.profileImage} fallback={c.user?.nickname ?? '?'} size="xs" />
                    <div className="flex-1 bg-gray-50 rounded-xl px-2.5 py-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-700">{c.user?.nickname}</span>
                          {c.createdAt && <span className="text-[10px] text-gray-400">{formatRelativeTime(c.createdAt)}</span>}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/cmt:opacity-100 transition-opacity">
                          {isMyComment ? (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-0.5 rounded text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setReportCommentId(c.id); setReportReason(''); setReportDetail(''); }}
                              className="p-0.5 rounded text-gray-300 hover:text-orange-400 transition-colors"
                            >
                              <Flag className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={cn('text-xs text-gray-500 mt-0.5', c.isDeleted && 'text-gray-400 italic')}>{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              className="input-field flex-1 text-xs py-1.5"
              placeholder="댓글 달기..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="px-2.5 py-1.5 bg-primary-500 text-white rounded-xl text-xs hover:bg-primary-600 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
