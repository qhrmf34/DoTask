'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ThumbsUp, ThumbsDown, MessageCircle, Pin, MoreHorizontal, Trash2, Flag, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface Reaction { type: 'LIKE' | 'DISLIKE'; userId: string }
interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  user: { id: string; nickname: string; profileImage?: string };
  _count: { comments: number; reactions: number };
  reactions?: Reaction[];
}

function PostCard({
  post, onRefetch, myRole,
}: { post: Post; crewId: string; onRefetch: () => void; myRole?: string }) {
  const user = useAuthStore((s) => s.user);
  const isMine = post.user?.id === user?.id;
  const canPin = myRole === 'OWNER' || myRole === 'ADMIN';
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const myReaction = post.reactions?.find((r) => r.userId === user?.id);
  const likes = post.reactions?.filter((r) => r.type === 'LIKE').length ?? 0;
  const dislikes = post.reactions?.filter((r) => r.type === 'DISLIKE').length ?? 0;

  const handleReact = async (type: 'LIKE' | 'DISLIKE') => {
    await api.post(`/posts/${post.id}/reactions`, { type }).catch(() => {});
    onRefetch();
  };

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제할까요?')) return;
    await api.delete(`/posts/${post.id}`);
    setMenuOpen(false);
    onRefetch();
  };

  const handlePin = async () => {
    await api.patch(`/posts/${post.id}/pin`).catch(() => {});
    setMenuOpen(false);
    onRefetch();
  };

  const handleReport = async () => {
    await api.post(`/posts/${post.id}/report`, { reason: 'INAPPROPRIATE' }).catch(() => {});
    setMenuOpen(false);
    alert('신고가 접수되었습니다.');
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post.id}/comments`);
        setComments(res.data?.items ?? res.data ?? []);
      } catch {}
      setLoadingComments(false);
    }
    setShowComments((v) => !v);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/posts/${post.id}/comments`, { content: commentText.trim() });
      setCommentText('');
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data?.items ?? res.data ?? []);
      onRefetch();
    } catch {}
  };

  if (post.isDeleted) return null;

  return (
    <div className={cn('card p-4', post.isPinned && 'border-amber-200 bg-amber-50/30')}>
      <div className="flex items-start gap-3">
        <Avatar src={post.user?.profileImage} fallback={post.user?.nickname ?? '?'} size="sm" />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{post.user?.nickname}</span>
              <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
              {post.isPinned && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  <Pin className="h-2.5 w-2.5" /> 공지
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[130px]">
                  {canPin && (
                    <button onClick={handlePin} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Pin className="h-3.5 w-3.5" /> {post.isPinned ? '공지 해제' : '공지로 올리기'}
                    </button>
                  )}
                  {isMine && (
                    <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" /> 삭제
                    </button>
                  )}
                  {!isMine && (
                    <button onClick={handleReport} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                      <Flag className="h-3.5 w-3.5" /> 신고
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className={cn('text-sm text-gray-700 whitespace-pre-wrap leading-relaxed', !expanded && 'line-clamp-5')}>
            {post.content}
          </p>
          {post.content.length > 200 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-500 mt-1 hover:underline">
              {expanded ? '접기' : '더보기'}
            </button>
          )}

          {/* Reactions row */}
          <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-gray-100">
            <button
              onClick={() => handleReact('LIKE')}
              className={cn('flex items-center gap-1.5 text-sm transition-colors',
                myReaction?.type === 'LIKE' ? 'text-primary-500 font-medium' : 'text-gray-400 hover:text-primary-400')}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{likes}</span>
            </button>
            <button
              onClick={() => handleReact('DISLIKE')}
              className={cn('flex items-center gap-1.5 text-sm transition-colors',
                myReaction?.type === 'DISLIKE' ? 'text-red-400 font-medium' : 'text-gray-400 hover:text-red-300')}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{dislikes}</span>
            </button>
            <button
              onClick={toggleComments}
              className={cn('flex items-center gap-1.5 text-sm transition-colors',
                showComments ? 'text-gray-600' : 'text-gray-400 hover:text-gray-600')}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post._count.comments}개 댓글</span>
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
              {loadingComments ? (
                <p className="text-xs text-gray-400">불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-400">첫 댓글을 남겨보세요.</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar src={c.user?.profileImage} fallback={c.user?.nickname ?? '?'} size="xs" />
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">{c.user?.nickname}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="flex gap-2 pt-1">
                <input
                  className="input-field flex-1 text-sm py-1.5"
                  placeholder="댓글 달기..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BoardPage({ params }: { params: { crewId: string } }) {
  const { crewId } = params;
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState('');
  const [writing, setWriting] = useState(false);
  const qc = useQueryClient();

  // Get my role in this crew
  const { data: members = [] } = useQuery<{ role: string; user: { id: string } }[]>({
    queryKey: ['crew-members', crewId],
    queryFn: () => api.get(`/crews/${crewId}/members`).then((r) => r.data),
  });
  const myRole = members.find((m) => m.user.id === user?.id)?.role;

  const { data, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey: ['posts', crewId],
    queryFn: ({ pageParam }) =>
      api.get(`/crews/${crewId}/posts${pageParam ? `?cursor=${pageParam}` : ''}`).then((r) => r.data),
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const posts: Post[] = (data?.pages ?? []).flatMap((p: any) => {
    if (Array.isArray(p?.data)) return p.data;
    if (Array.isArray(p?.items)) return p.items;
    if (Array.isArray(p)) return p;
    return [];
  }).filter((p: any) => p && !p.isDeleted);

  const handlePost = async () => {
    if (!content.trim()) return;
    await api.post(`/crews/${crewId}/posts`, { content });
    setContent('');
    setWriting(false);
    refetch();
    qc.invalidateQueries({ queryKey: ['posts-latest', crewId] });
  };

  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between py-1">
          <h2 className="text-base font-bold text-gray-900">게시판</h2>
          <button
            onClick={() => setWriting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> 글쓰기
          </button>
        </div>

        {/* Write modal */}
        {writing && (
          <div className="card p-4 space-y-3 border border-primary-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">새 게시글</p>
              <button onClick={() => { setWriting(false); setContent(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              autoFocus
              className="input-field resize-none"
              rows={4}
              placeholder="크루원들과 공유할 내용을 작성하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setWriting(false); setContent(''); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button onClick={handlePost} disabled={!content.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors">
                게시
              </button>
            </div>
          </div>
        )}

        {/* Pinned posts */}
        {pinnedPosts.length > 0 && (
          <div className="space-y-3">
            {pinnedPosts.map((post) => (
              <PostCard key={post.id} post={post} crewId={crewId} onRefetch={refetch} myRole={myRole} />
            ))}
          </div>
        )}

        {/* Regular posts */}
        {regularPosts.length > 0 && (
          <div className="space-y-3">
            {regularPosts.map((post) => (
              <PostCard key={post.id} post={post} crewId={crewId} onRefetch={refetch} myRole={myRole} />
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">아직 게시글이 없습니다.</p>
            <button onClick={() => setWriting(true)} className="mt-2 text-xs text-primary-500 hover:underline">
              첫 번째 게시글 작성하기
            </button>
          </div>
        )}

        {hasNextPage && (
          <button onClick={() => fetchNextPage()} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 text-center">
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}
