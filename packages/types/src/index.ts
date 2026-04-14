// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthTokens {
  accessToken: string;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profileImage: string | null;
  bio: string | null;
  provider: 'local' | 'google' | 'kakao';
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface UpdateProfileDto {
  nickname?: string;
  bio?: string;
}

// ─── Todo Category ───────────────────────────────────────────────────────────
export interface TodoCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
}

export interface CreateTodoCategoryDto {
  name: string;
  color: string;
}

export interface UpdateTodoCategoryDto {
  name?: string;
  color?: string;
  order?: number;
}

// ─── Todo ─────────────────────────────────────────────────────────────────────
export interface Todo {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  category?: TodoCategory;
  _count?: {
    comments: number;
    reactions: number;
  };
  myReaction?: 'LIKE' | 'DISLIKE' | null;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string;
  categoryId?: string;
  order?: number;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  dueDate?: string;
  categoryId?: string;
  isCompleted?: boolean;
  order?: number;
}

export interface CalendarDay {
  date: string;
  total: number;
  done: number;
  pct: number;
}

// ─── Pomodoro Settings ────────────────────────────────────────────────────────
export interface PomodoroSettings {
  id: string;
  userId: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  soundVolume: number;
}

export interface UpdatePomodoroSettingsDto {
  workMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  longBreakInterval?: number;
  autoStartBreak?: boolean;
  autoStartWork?: boolean;
  soundEnabled?: boolean;
  soundVolume?: number;
}

// ─── Crew ─────────────────────────────────────────────────────────────────────
export type CrewVisibility = 'PUBLIC' | 'PASSWORD' | 'PRIVATE';
export type CrewMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Crew {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  themeColor: string;
  bannerImage: string | null;
  category: string;
  visibility: CrewVisibility;
  inviteCode: string;
  maxMembers: number;
  tags: string[];
  rules: string | null;
  createdAt: string;
  _count?: { members: number };
  myRole?: CrewMemberRole | null;
}

export interface CreateCrewDto {
  name: string;
  description?: string;
  emoji?: string;
  themeColor?: string;
  category: string;
  visibility?: CrewVisibility;
  password?: string;
  maxMembers?: number;
  tags?: string[];
  rules?: string;
}

export interface UpdateCrewDto {
  name?: string;
  description?: string;
  emoji?: string;
  themeColor?: string;
  category?: string;
  visibility?: CrewVisibility;
  password?: string;
  maxMembers?: number;
  tags?: string[];
  rules?: string;
}

export interface CrewMember {
  id: string;
  crewId: string;
  userId: string;
  role: CrewMemberRole;
  joinedAt: string;
  user: Pick<UserProfile, 'id' | 'nickname' | 'profileImage'>;
}

// ─── Channel ─────────────────────────────────────────────────────────────────
export type ChannelType = 'GENERAL' | 'NOTICE' | 'GOAL';

export interface Channel {
  id: string;
  crewId: string;
  name: string;
  type: ChannelType;
  order: number;
}

// ─── Message ─────────────────────────────────────────────────────────────────
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM' | 'TODO_COMPLETE';

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown> | null;
  isDeleted: boolean;
  createdAt: string;
  user: Pick<UserProfile, 'id' | 'nickname' | 'profileImage'>;
}

export interface SendMessageDto {
  channelId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

// ─── Post ─────────────────────────────────────────────────────────────────────
export interface Post {
  id: string;
  crewId: string;
  userId: string;
  content: string;
  imageUrls: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<UserProfile, 'id' | 'nickname' | 'profileImage'>;
  _count?: { comments: number; reactions: number };
  myReaction?: 'LIKE' | 'DISLIKE' | null;
}

// ─── Comment ─────────────────────────────────────────────────────────────────
export type CommentTargetType = 'TODO' | 'POST';

export interface Comment {
  id: string;
  userId: string;
  targetType: CommentTargetType;
  todoId: string | null;
  postId: string | null;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<UserProfile, 'id' | 'nickname' | 'profileImage'>;
  replies?: Comment[];
  _count?: { reactions: number };
  myReaction?: 'LIKE' | 'DISLIKE' | null;
}

// ─── Reaction ─────────────────────────────────────────────────────────────────
export type ReactionType = 'LIKE' | 'DISLIKE';
export type ReactionTargetType = 'TODO' | 'POST' | 'COMMENT';

// ─── Pomodoro Session ─────────────────────────────────────────────────────────
export type PomodoroSessionStatus = 'RUNNING' | 'PAUSED' | 'DONE';

export interface PomodoroSession {
  id: string;
  crewId: string;
  startedById: string;
  workMinutes: number;
  breakMinutes: number;
  status: PomodoroSessionStatus;
  startedAt: string;
  endsAt: string;
  participants?: Array<{
    userId: string;
    user: Pick<UserProfile, 'id' | 'nickname' | 'profileImage'>;
  }>;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'COMMENT_ON_TODO'
  | 'REACTION_ON_TODO'
  | 'COMMENT_ON_POST'
  | 'REACTION_ON_POST'
  | 'COMMENT_ON_COMMENT'
  | 'CREW_INVITE'
  | 'CREW_JOINED'
  | 'CREW_KICKED'
  | 'POMODORO_START'
  | 'NEW_NOTICE_POST';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface CursorPaginated<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Socket Events ───────────────────────────────────────────────────────────
export interface SocketChatSend {
  channelId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

export interface SocketPomoStart {
  crewId: string;
  workMin: number;
  breakMin: number;
}
