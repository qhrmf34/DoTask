'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ThumbsUp, ThumbsDown, MessageCircle, Pin, MoreHorizontal, Trash2, Flag, X, Send } from 'lucide-react';
import { Mascot } from '@/components/ui/Mascot';
import { Avatar } from '@/components/ui/avatar';
import { useDialog } from '@/components/ui/dialog';
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
  const { confirm } = useDialog();
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
    const ok = await confirm({ title: '게시글 삭제', message: '이 게시글을 삭제할까요?', confirmText: '삭제', cancelText: '취소', type: 'danger' });
    if (!ok) return;
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
    await confirm({ title: '신고 완료', message: '신고가 접수되었습니다.', confirmText: '확인', type: 'alert' });
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
    <div className={cn('card overflow-hidden', post.isPinned && 'border-amber-200')}>
      {post.isPinned && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <Pin className="h-3 w-3 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600">공지</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar src={post.user?.profileImage} fallback={post.user?.nickname ?? '?'} size="sm" />
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{post.user?.nickname}</span>
                <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
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
            <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-gray-100">
              <button
                onClick={() => handleReact('LIKE')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all',
                  myReaction?.type === 'LIKE'
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{likes}</span>
              </button>
              <button
                onClick={() => handleReact('DISLIKE')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all',
                  myReaction?.type === 'DISLIKE'
                    ? 'bg-red-50 text-red-500 font-medium'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span>{dislikes}</span>
              </button>
              <button
                onClick={toggleComments}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all',
                  showComments ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>댓글 {post._count.comments > 0 ? post._count.comments : ''}</span>
              </button>
            </div>

            {/* Comments */}
            {showComments && (
              <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                {loadingComments ? (
                  <p className="text-xs text-gray-400 py-2 text-center">불러오는 중...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">첫 댓글을 남겨보세요.</p>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <Avatar src={c.user?.profileImage} fallback={c.user?.nickname ?? '?'} size="xs" />
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-800">{c.user?.nickname}</span>
                          <span className="text-[10px] text-gray-400">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    className="input-field flex-1 text-sm py-2"
                    placeholder="댓글 달기..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WriteCard({ crewId, onPost, user }: { crewId: string; onPost: () => void; user: any }) {
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const qc = useQueryClient();

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post(`/crews/${crewId}/posts`, { content });
      setContent('');
      setFocused(false);
      onPost();
      qc.invalidateQueries({ queryKey: ['posts-latest', crewId] });
    } catch {} finally {
      setPosting(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={user?.profileImage} fallback={user?.nickname} size="sm" />
        <div className="flex-1">
          <textarea
            className="input-field resize-none w-full transition-all"
            rows={focused ? 3 : 1}
            placeholder="크루원들과 공유할 내용을 작성하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {focused && (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => { setFocused(false); setContent(''); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePost}
                disabled={!content.trim() || posting}
                className="px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors"
              >
                게시
              </button>
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

  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: '#f7f8fa' }}>
      <div className="max-w-3xl mx-auto px-6 py-5 space-y-3">
        {/* Write card */}
        <WriteCard crewId={crewId} onPost={refetch} user={user} />

        {/* Pinned posts */}
        {pinnedPosts.map((post) => (
          <PostCard key={post.id} post={post} crewId={crewId} onRefetch={refetch} myRole={myRole} />
        ))}

        {/* Regular posts */}
        {regularPosts.map((post) => (
          <PostCard key={post.id} post={post} crewId={crewId} onRefetch={refetch} myRole={myRole} />
        ))}

        {posts.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="mascot-float">
              <Mascot size={72} variant="sleep" />
            </div>
            <p className="text-sm font-bold" style={{ color: '#6d28d9' }}>아직 게시글이 없어요</p>
            <p className="text-xs text-gray-400">첫 번째 게시글을 작성해보세요</p>
          </div>
        )}

        {hasNextPage && (
          <button onClick={() => fetchNextPage()} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 text-center card">
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}
