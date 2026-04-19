'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send, Paperclip, X, File, Image as ImageIcon, MoreHorizontal, Pencil, Trash2, Flag, Lock,
} from 'lucide-react';
import { cn, formatTime, formatFileSize, resolveUrl } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useDialog } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';

interface Message {
  id: string;
  content: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  user?: { id: string; nickname: string; profileImage?: string };
}

export default function ChannelPage({ params }: { params: { crewId: string; channelId: string } }) {
  const { crewId, channelId } = params;
  const user = useAuthStore((s) => s.user);

  const { confirm } = useDialog();
  const [input, setInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  const qc = useQueryClient();

  // ── Channel info & role ─────────────────────────────────────
  const { data: channels = [] } = useQuery<{ id: string; name: string; type: string }[]>({
    queryKey: ['channels', crewId],
    queryFn: () => api.get(`/crews/${crewId}/channels`).then((r) => r.data),
  });
  const channelInfo = channels.find((ch) => ch.id === channelId);
  const { data: members = [] } = useQuery<{ role: string; user: { id: string } }[]>({
    queryKey: ['crew-members', crewId],
    queryFn: () => api.get(`/crews/${crewId}/members`).then((r) => r.data),
  });
  const myRole = members.find((m) => m.user.id === user?.id)?.role;
  const isAnnouncement = channelInfo?.type === 'NOTICE';
  const canPost = !isAnnouncement || myRole === 'OWNER' || myRole === 'ADMIN';

  // ── Messages query ──────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) =>
      api.get(`/channels/${channelId}/messages${pageParam ? `?cursor=${pageParam}` : ''}`).then((r) => r.data),
    getNextPageParam: (page) => page?.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const messages: Message[] = [...(data?.pages ?? [])]
    .reverse()
    .flatMap((p) => p?.data ?? p?.items ?? [])
    .filter((m): m is Message => m != null);

  // ── Socket ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit('chat:join', { channelId });

    socket.on('chat:message', (msg: Message) => {
      if (!msg) return;
      qc.setQueryData(['messages', channelId], (old: any) => {
        if (!old?.pages?.length) return old;
        const pages = [...old.pages];
        pages[0] = { ...pages[0], data: [...(pages[0]?.data ?? pages[0]?.items ?? []), msg] };
        return { ...old, pages };
      });
    });

    socket.on('chat:edited', (msg: Message) => {
      if (!msg) return;
      qc.setQueryData(['messages', channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: any) => ({
            ...p,
            data: (p.data ?? p.items ?? []).map((m: Message) => m?.id === msg.id ? msg : m),
          })),
        };
      });
    });

    socket.on('chat:deleted', ({ id }: { id: string }) => {
      qc.setQueryData(['messages', channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: any) => ({
            ...p,
            data: (p.data ?? p.items ?? []).map((m: Message) =>
              m?.id === id ? { ...m, isDeleted: true, content: '삭제된 메시지입니다.' } : m,
            ),
          })),
        };
      });
    });

    return () => {
      socket.emit('chat:leave', { channelId });
      socket.off('chat:message');
      socket.off('chat:edited');
      socket.off('chat:deleted');
    };
  }, [channelId, qc]);

  // 새 메시지가 추가됐을 때만 스크롤 (이전 메시지 로드 시에는 스크롤 안 함)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.id !== lastMsgIdRef.current) {
      lastMsgIdRef.current = lastMsg.id;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Send ────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() && !uploadFile) return;
    const socket = getSocket();

    if (uploadFile) {
      const formData = new FormData();
      formData.append('file', uploadFile);
      try {
        const res = await api.post('/upload/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        socket.emit('chat:send', {
          channelId,
          content: uploadFile.name,
          type: res.data.type === 'IMAGE' ? 'IMAGE' : 'FILE',
          fileUrl: res.data.url,
          fileName: res.data.fileName,
          fileSize: res.data.fileSize,
          fileMimeType: res.data.fileMimeType,
        });
        setUploadFile(null);
      } catch {}
    } else {
      socket.emit('chat:send', { channelId, content: input.trim(), type: 'TEXT' });
      setInput('');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    const newContent = editContent.trim();
    setEditingId(null);
    // 즉시 캐시 업데이트
    qc.setQueryData(['messages', channelId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p: any) => ({
          ...p,
          data: (p.data ?? p.items ?? []).map((m: Message) =>
            m?.id === id ? { ...m, content: newContent, isEdited: true } : m,
          ),
        })),
      };
    });
    await api.patch(`/messages/${id}`, { content: newContent });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: '메시지 삭제', message: '이 메시지를 삭제할까요?', confirmText: '삭제', cancelText: '취소', type: 'danger' });
    if (!ok) return;
    setMenuOpen(null);
    // 즉시 캐시 업데이트
    qc.setQueryData(['messages', channelId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p: any) => ({
          ...p,
          data: (p.data ?? p.items ?? []).map((m: Message) =>
            m?.id === id ? { ...m, isDeleted: true, content: '삭제된 메시지입니다.' } : m,
          ),
        })),
      };
    });
    await api.delete(`/messages/${id}`);
  };

  const [reportModal, setReportModal] = useState<{ msgId: string } | null>(null);
  const [reportReason, setReportReason] = useState('INAPPROPRIATE');
  const [reportDetail, setReportDetail] = useState('');

  const REPORT_REASONS = [
    { value: 'SPAM', label: '스팸 / 홍보' },
    { value: 'ABUSE', label: '욕설 / 비방' },
    { value: 'HATE', label: '혐오 / 차별' },
    { value: 'INAPPROPRIATE', label: '부적절한 내용' },
    { value: 'OTHER', label: '기타' },
  ];

  const handleReport = async (id: string) => {
    setMenuOpen(null);
    setReportReason('INAPPROPRIATE');
    setReportDetail('');
    setReportModal({ msgId: id });
  };

  const submitReport = async () => {
    if (!reportModal) return;
    await api.post(`/messages/${reportModal.msgId}/report`, { reason: reportReason, detail: reportDetail || undefined });
    setReportModal(null);
    await confirm({ title: '신고 완료', message: '신고가 접수되었습니다.', confirmText: '확인', type: 'alert' });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#f7f8fa' }}>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 relative">

        <style>{`
          @keyframes ghost-pat-arm {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            30%       { transform: translateY(-10px) rotate(-4deg); }
            60%       { transform: translateY(-6px) rotate(3deg); }
          }
        `}</style>

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            className="w-full text-xs text-primary-400 hover:text-primary-600 py-2 text-center font-semibold mb-2"
          >
            이전 메시지 불러오기
          </button>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
            <div className="mascot-float">
              <img src="/mascot/mascot_cheer.png" alt="" style={{ height: 140, width: 'auto', objectFit: 'contain' }} />
            </div>
            <div className="text-center pointer-events-none">
              <p className="text-sm font-bold" style={{ color: '#6d28d9' }}>첫 메시지를 보내보세요</p>
              <p className="text-xs text-gray-400 mt-0.5">토리가 응원하고 있어요</p>
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-0.5">
          {messages.map((msg, i) => {
            if (!msg) return null;
            const isMine = msg.user?.id === user?.id;
            const prevMsg = messages[i - 1];
            const showAvatar = i === 0 || prevMsg?.user?.id !== msg.user?.id || (() => {
              const msgDate = new Date(msg.createdAt).toDateString();
              const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
              return msgDate !== prevDate;
            })();

            const msgDate = new Date(msg.createdAt).toDateString();
            const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
            const showDateSep = i === 0 || msgDate !== prevDate;
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const dateLabel = msgDate === today ? '오늘'
              : msgDate === yesterday ? '어제'
              : new Date(msg.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

            return (
              <React.Fragment key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex-1 h-px" style={{ background: '#ddd6fe' }} />
                    <span
                      className="text-[11px] font-bold px-3 py-1 rounded-full shrink-0"
                      style={{ background: '#ede9fe', color: '#6d28d9' }}
                    >
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px" style={{ background: '#ddd6fe' }} />
                  </div>
                )}

                {/* System message */}
                {msg.type === 'SYSTEM' && (
                  <div className="flex items-center justify-center py-1.5">
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                )}

                {/* Message row */}
                {msg.type !== 'SYSTEM' && <div className={cn(
                  'group flex items-end gap-2 px-1',
                  isMine ? 'justify-end' : 'justify-start',
                  showAvatar ? 'mt-3' : 'mt-0.5',
                )}>
                  {/* Avatar — 상대방 메시지 왼쪽 */}
                  {!isMine && (
                    <div className="w-8 shrink-0 self-end">
                      {showAvatar && (
                        <Avatar src={msg.user?.profileImage} fallback={msg.user?.nickname ?? '?'} size="sm" />
                      )}
                    </div>
                  )}

                  {/* Action menu — 내 메시지일 때 버블 왼쪽 */}
                  {!msg.isDeleted && isMine && (
                    <div className={cn(
                      'flex items-center transition-opacity shrink-0 self-center',
                      menuOpen === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-gray-300 hover:text-violet-500 hover:bg-white shadow-sm transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {menuOpen === msg.id && (
                          <div
                            className="absolute top-full right-0 z-20 mt-1 bg-white rounded-2xl shadow-soft py-1 min-w-[120px]"
                            style={{ border: '1px solid #e8e4f8' }}
                          >
                            {msg.type === 'TEXT' && (
                              <button
                                onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setMenuOpen(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 rounded-t-2xl"
                              >
                                <Pencil className="h-3.5 w-3.5" /> 수정
                              </button>
                            )}
                            <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" /> 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cn('flex flex-col max-w-[72%]', isMine ? 'items-end' : 'items-start')}>
                    {!isMine && showAvatar && (
                      <span className="text-[11px] font-bold mb-1 ml-1" style={{ color: '#5b21b6' }}>
                        {msg.user?.nickname ?? '알 수 없음'}
                      </span>
                    )}

                    {editingId === msg.id ? (
                      <div className="flex gap-2 items-end w-full">
                        <input
                          autoFocus
                          className="input-field text-sm flex-1"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(msg.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => handleEdit(msg.id)} className="text-xs text-primary-600 shrink-0 font-semibold">저장</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 shrink-0">취소</button>
                      </div>
                    ) : (
                      /* ── Bubble ── */
                      <div
                        className={cn(
                          'relative px-3.5 py-2.5 text-sm break-words leading-relaxed',
                          isMine ? 'rounded-3xl rounded-br-md' : 'rounded-3xl rounded-bl-md',
                        )}
                        style={msg.isDeleted
                          ? { background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', fontStyle: 'italic' }
                          : isMine
                            ? { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', color: 'white', boxShadow: '0 2px 10px rgba(139,92,246,0.28)' }
                            : { background: 'white', color: '#1e1a2e', border: '1px solid #e8e4f8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                        }
                      >
                        {msg.type === 'IMAGE' && msg.fileUrl ? (
                          <img src={resolveUrl(msg.fileUrl)} alt={msg.fileName ?? ''} className="rounded-2xl object-cover max-w-[240px] max-h-[180px]" />
                        ) : msg.type === 'FILE' && msg.fileUrl ? (
                          <a href={msg.fileUrl} download={msg.fileName}
                            className={cn('flex items-center gap-2', isMine ? 'text-white' : 'text-primary-600')}>
                            <File className="h-4 w-4 shrink-0" />
                            <span className="text-xs underline truncate max-w-[160px]">{msg.fileName}</span>
                            {msg.fileSize && <span className="text-xs opacity-70 shrink-0">{formatFileSize(msg.fileSize)}</span>}
                          </a>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    )}

                    <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMine ? 'justify-end' : '')}>
                      <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                      {msg.isEdited && <span className="text-[10px] text-gray-400">· 수정됨</span>}
                    </div>
                  </div>

                  {/* Action menu — 상대방 메시지일 때 버블 오른쪽 */}
                  {!msg.isDeleted && !isMine && (
                    <div className={cn(
                      'flex items-center transition-opacity shrink-0 self-center',
                      menuOpen === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-gray-300 hover:text-violet-500 hover:bg-white shadow-sm transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {menuOpen === msg.id && (
                          <div
                            className="absolute top-full left-0 z-20 mt-1 bg-white rounded-2xl shadow-soft py-1 min-w-[120px]"
                            style={{ border: '1px solid #e8e4f8' }}
                          >
                            <button onClick={() => handleReport(msg.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-violet-50">
                              <Flag className="h-3.5 w-3.5" /> 신고
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>}
              </React.Fragment>
            );
          })}
        </div>

        {/* bottomRef — 항상 렌더링해서 ref가 항상 존재하도록 */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* File preview */}
      {uploadFile && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ background: '#f0ebff', borderTop: '1px solid #e8e4f8' }}
        >
          {uploadFile.type.startsWith('image/')
            ? <ImageIcon className="h-4 w-4 text-primary-400" />
            : <File className="h-4 w-4 text-primary-400" />
          }
          <span className="text-sm text-gray-700 flex-1 truncate">{uploadFile.name}</span>
          <span className="text-xs text-gray-400">{formatFileSize(uploadFile.size)}</span>
          <button onClick={() => setUploadFile(null)} className="text-gray-400 hover:text-red-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="px-3 py-3" style={{ background: 'white', borderTop: '1px solid #e8e4f8' }}>
        <style>{`
          @keyframes cat-breathe {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50%       { transform: translateY(-2px) rotate(1deg); }
          }
        `}</style>
        <input type="file" ref={fileRef} className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />

        {/* Announcement read-only notice */}
        {!canPost && (
          <div
            className="flex items-center justify-center gap-2 rounded-3xl px-4 py-3"
            style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb' }}
          >
            <Lock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">공지 채널은 방장과 부방장만 글을 쓸 수 있어요</span>
          </div>
        )}

        {/* Input row */}
        {canPost && (
          <div className="flex items-center relative">
            {/* Input pill */}
            <div
              className="flex-1 flex items-center gap-1.5 rounded-3xl px-3 py-1.5 transition-all"
              style={{ background: '#f3f2fe', border: '1.5px solid #ddd6fe', position: 'relative' }}
            >
              {/* Paperclip */}
              <button
                onClick={() => fileRef.current?.click()}
                className="h-7 w-7 rounded-xl flex items-center justify-center text-primary-400 hover:text-primary-600 hover:bg-primary-100 transition-colors shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Text input */}
              <textarea
                className="flex-1 bg-transparent text-sm resize-none min-h-[28px] max-h-32 py-1 outline-none placeholder:text-primary-300 text-gray-800 leading-snug"
                placeholder="메시지를 입력하세요..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() && !uploadFile}
                className={cn(
                  'h-8 w-8 rounded-2xl flex items-center justify-center shrink-0 transition-all',
                  (input.trim() || uploadFile) ? 'text-white shadow-sm' : 'text-primary-200',
                )}
                style={(input.trim() || uploadFile) ? { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' } : {}}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── 신고 모달 ── */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">메시지 신고</h3>
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
              className="w-full input-field text-sm resize-none"
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
