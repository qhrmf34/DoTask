'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send, Paperclip, X, File, Image as ImageIcon, MoreHorizontal, Pencil, Trash2, Flag,
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
  const { channelId } = params;
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

  // ── Messages query ──────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) =>
      api.get(`/channels/${channelId}/messages${pageParam ? `?cursor=${pageParam}` : ''}`).then((r) => r.data),
    getNextPageParam: (page) => page?.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // pages[0] = 가장 최근 메시지 (ASC), pages[1] = 더 오래된 메시지 (ASC)
  // 화면 표시는 오래된 것부터: 페이지 역순으로 flatMap
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
    await api.patch(`/messages/${id}`, { content: editContent });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: '메시지 삭제', message: '이 메시지를 삭제할까요?', confirmText: '삭제', cancelText: '취소', type: 'danger' });
    if (!ok) return;
    await api.delete(`/messages/${id}`);
    setMenuOpen(null);
  };

  const handleReport = async (id: string) => {
    await api.post(`/messages/${id}/report`, { reason: 'INAPPROPRIATE' });
    setMenuOpen(null);
    await confirm({ title: '신고 완료', message: '신고가 접수되었습니다.', confirmText: '확인', type: 'alert' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-1">
        {hasNextPage && (
          <button onClick={() => fetchNextPage()} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 text-center">
            이전 메시지 불러오기
          </button>
        )}

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
          const dateLabel = msgDate === today ? '오늘' : msgDate === yesterday ? '어제' : new Date(msg.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

          return (
            <React.Fragment key={msg.id}>
            {showDateSep && (
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold bg-gray-100 px-3 py-1 rounded-full shrink-0">{dateLabel}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* Message row */}
            <div className={cn('group flex items-end gap-2 px-1', isMine ? 'flex-row-reverse' : 'flex-row', showAvatar ? 'mt-2' : 'mt-0.5')}>
              {/* Avatar */}
              <div className="w-8 shrink-0 self-end">
                {!isMine && showAvatar && (
                  <Avatar src={msg.user?.profileImage} fallback={msg.user?.nickname ?? '?'} size="sm" />
                )}
              </div>

              <div className={cn('flex flex-col max-w-[68%]', isMine ? 'items-end' : 'items-start')}>
                {!isMine && showAvatar && (
                  <span className="text-[11px] text-gray-500 font-semibold mb-1 ml-1">
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
                    <button onClick={() => handleEdit(msg.id)} className="text-xs text-primary-600 shrink-0 font-medium">저장</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 shrink-0">취소</button>
                  </div>
                ) : (
                  <div className={cn(
                    'relative px-3.5 py-2.5 text-sm break-words leading-relaxed shadow-sm',
                    isMine
                      ? 'bg-primary-500 text-white rounded-2xl rounded-br-sm shadow-primary-100'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100',
                    msg.isDeleted && 'opacity-50 italic',
                  )}>
                    {msg.type === 'IMAGE' && msg.fileUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveUrl(msg.fileUrl)} alt={msg.fileName ?? ''} className="rounded-xl object-cover max-w-[240px] max-h-[180px]" />
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

                <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMine ? 'flex-row-reverse' : '')}>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                  {msg.isEdited && <span className="text-[10px] text-gray-400">· 수정됨</span>}
                </div>
              </div>

              {/* Action menu */}
              {!msg.isDeleted && (
                <div className={cn('flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center', isMine && 'order-first')}>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                      className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white shadow-sm transition-colors"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen === msg.id && (
                      <div className={cn('absolute top-full z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[120px]', isMine ? 'right-0' : 'left-0')}>
                        {isMine && msg.type === 'TEXT' && (
                          <button
                            onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> 수정
                          </button>
                        )}
                        {isMine && (
                          <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" /> 삭제
                          </button>
                        )}
                        {!isMine && (
                          <button onClick={() => handleReport(msg.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Flag className="h-3.5 w-3.5" /> 신고
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {uploadFile && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 bg-gray-50">
          {uploadFile.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-gray-500" /> : <File className="h-4 w-4 text-gray-500" />}
          <span className="text-sm text-gray-700 flex-1 truncate">{uploadFile.name}</span>
          <span className="text-xs text-gray-400">{formatFileSize(uploadFile.size)}</span>
          <button onClick={() => setUploadFile(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <input type="file" ref={fileRef} className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
          <button
            onClick={() => fileRef.current?.click()}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0 mb-0.5"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            className="flex-1 bg-transparent text-sm resize-none min-h-[32px] max-h-32 py-1 outline-none placeholder:text-gray-400 text-gray-800"
            placeholder="메시지 입력..."
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
          <button
            onClick={sendMessage}
            disabled={!input.trim() && !uploadFile}
            className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5',
              (input.trim() || uploadFile) ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm' : 'text-gray-300',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
