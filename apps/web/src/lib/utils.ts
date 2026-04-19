import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short') {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay === 1) return `어제 ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDay < 7) return `${d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatSeconds(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// DB에 저장된 로컬 업로드 URL을 상대경로로 변환 (Next.js rewrites가 프록시)
export function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // http://localhost:4000/uploads/... → /uploads/...
  return url.replace(/^https?:\/\/[^/]+\/uploads\//, '/uploads/');
}
