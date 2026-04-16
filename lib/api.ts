import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BACKEND_BASE_URL = 'https://bcabuddy-web-f5dfgtb2b0dmc8aq.centralindia-01.azurewebsites.net';
const ACCESS_TOKEN_KEY = '@bcabuddy_access_token';
const TOKEN_KEYS = [ACCESS_TOKEN_KEY, 'token', 'access_token'];

type AuthFailureHandler = () => void | Promise<void>;
let authFailureHandler: AuthFailureHandler | null = null;

export type BackendStatus = 'online' | 'offline';
export type ResponseMode = 'fast' | 'thinking' | 'pro';

export interface SessionSummary {
  id: number;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatHistoryItem {
  id?: number;
  user_message?: string;
  ai_response?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = 'API_ERROR', status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function setAuthFailureHandler(handler: AuthFailureHandler | null): void {
  authFailureHandler = handler;
}

export function getBackendBaseUrl(): string {
  return DEFAULT_BACKEND_BASE_URL;
}

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalized}`;
}

export async function persistAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await Promise.all(TOKEN_KEYS.map((key) => AsyncStorage.removeItem(key)));
}

async function throwApiError(
  res: Response,
  code: string,
  fallbackMessage: string
): Promise<never> {
  if (res.status === 401) {
    await clearStoredToken();
    if (authFailureHandler) {
      await authFailureHandler();
    }
    throw new ApiError('Session expired. Please login again.', 'UNAUTHORIZED', 401);
  }

  const text = await res.text().catch(() => '');
  throw new ApiError(text || `${fallbackMessage} with ${res.status}`, code, res.status);
}

export async function getStoredToken(): Promise<string | null> {
  for (const key of TOKEN_KEYS) {
    const token = await AsyncStorage.getItem(key);
    if (token && token.trim()) {
      return token.trim();
    }
  }

  return null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface SignupPayload {
  username: string;
  password: string;
  semester?: string;
  email?: string;
}

interface ForgotPasswordResponse {
  message?: string;
  reset_token?: string;
  expires_in_minutes?: number;
  email_sent?: boolean;
}

export interface DashboardStats {
  total_sessions?: number;
  last_subject?: string;
  study_hours?: number;
  avg_quiz_score?: number;
  recent_activity?: unknown[];
}

export interface LatestStudyRoadmap {
  has_roadmap?: boolean;
  roadmap_id?: number;
  title?: string;
  subject?: string;
  semester?: number;
  duration_days?: number;
  total_days?: number;
  completed_days?: number;
  completion_pct?: number;
  created_at?: string;
  days?: Array<Record<string, unknown>>;
}

interface ProfileUpdatePayload {
  display_name?: string;
  mobile_number?: string;
  email?: string;
  exam_date?: string;
  exam_session?: string;
  default_response_mode?: ResponseMode;
  enable_notifications?: boolean;
  auto_save_history?: boolean;
  show_quick_suggestions?: boolean;
  privacy_mode?: boolean;
}

export interface SubjectiveGradingPayload {
  question: string;
  student_answer: string;
  expected_answer?: string;
  subject?: string;
  semester?: number;
}

export interface RoadmapHistoryItem {
  id?: number;
  roadmap_id?: number;
  title?: string;
  subject?: string;
  semester?: number;
  accepted_at?: string;
  created_at?: string;
}

export async function loginWithBackend(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);

  const res = await fetch(buildApiUrl('/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    await throwApiError(res, 'LOGIN_FAILED', 'Login failed');
  }

  const data = (await res.json()) as LoginResponse;
  if (!data?.access_token) {
    throw new ApiError('No access token returned by backend.', 'LOGIN_TOKEN_MISSING', 500);
  }

  await persistAuthToken(data.access_token);
  return data;
}

export async function signupWithBackend(payload: SignupPayload): Promise<void> {
  const res = await fetch(buildApiUrl('/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await throwApiError(res, 'SIGNUP_FAILED', 'Signup failed');
  }
}

export async function forgotPasswordWithBackend(username: string): Promise<ForgotPasswordResponse> {
  const res = await fetch(buildApiUrl('/forgot-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    await throwApiError(res, 'FORGOT_PASSWORD_FAILED', 'Forgot password failed');
  }

  return (await res.json()) as ForgotPasswordResponse;
}

export async function resetPasswordWithBackend(
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<Record<string, unknown>> {
  const res = await fetch(buildApiUrl('/reset-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (!res.ok) {
    await throwApiError(res, 'RESET_PASSWORD_FAILED', 'Reset password failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function fetchProfile(token: string): Promise<Record<string, unknown>> {
  const res = await fetch(buildApiUrl('/profile'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'PROFILE_FETCH_FAILED', 'Profile fetch failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function updateProfileWithBackend(payload: ProfileUpdatePayload): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/profile'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await throwApiError(res, 'PROFILE_UPDATE_FAILED', 'Profile update failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function updateExamDateWithBackend(examDate: string, examSession = 'Custom Session'): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/profile/exam-date'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ exam_date: examDate, exam_session: examSession }),
  });

  if (!res.ok) {
    await throwApiError(res, 'EXAM_DATE_UPDATE_FAILED', 'Exam date update failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function getProfileAchievementsWithBackend(): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/profile/achievements'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'ACHIEVEMENTS_FETCH_FAILED', 'Achievements fetch failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function updateProfileAchievementsWithBackend(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/profile/achievements'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await throwApiError(res, 'ACHIEVEMENTS_UPDATE_FAILED', 'Achievements update failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

async function requireToken(): Promise<string> {
  const token = await getStoredToken();
  if (!token) {
    throw new ApiError('Auth token not found.', 'NO_AUTH_TOKEN', 401);
  }
  return token;
}

export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const res = await fetch(buildApiUrl('/api/health'));
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export async function fetchDashboardStatsWithBackend(): Promise<DashboardStats> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/dashboard-stats'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'DASHBOARD_STATS_FAILED', 'Dashboard stats fetch failed');
  }

  return (await res.json()) as DashboardStats;
}

export async function fetchLatestStudyRoadmapWithBackend(): Promise<LatestStudyRoadmap> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/study-roadmap/latest'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'ROADMAP_LATEST_FAILED', 'Study roadmap fetch failed');
  }

  return (await res.json()) as LatestStudyRoadmap;
}

export async function acceptStudyRoadmapWithBackend(roadmapId?: number): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const query = typeof roadmapId === 'number' ? `?roadmap_id=${roadmapId}` : '';
  const res = await fetch(buildApiUrl(`/study-roadmap/accept${query}`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'ROADMAP_ACCEPT_FAILED', 'Study roadmap accept failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function fetchStudyRoadmapHistoryWithBackend(): Promise<RoadmapHistoryItem[]> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/study-roadmap/history'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'ROADMAP_HISTORY_FAILED', 'Study roadmap history fetch failed');
  }

  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    id: typeof row.id === 'number' ? row.id : undefined,
    roadmap_id: typeof row.roadmap_id === 'number' ? row.roadmap_id : undefined,
    title: typeof row.title === 'string' ? row.title : undefined,
    subject: typeof row.subject === 'string' ? row.subject : undefined,
    semester: typeof row.semester === 'number' ? row.semester : undefined,
    accepted_at: typeof row.accepted_at === 'string' ? row.accepted_at : undefined,
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
  }));
}

export async function gradeSubjectiveWithBackend(payload: SubjectiveGradingPayload): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/grade-subjective'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await throwApiError(res, 'SUBJECTIVE_GRADING_FAILED', 'Subjective grading failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function changePasswordWithBackend(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/profile/change-password'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (!res.ok) {
    await throwApiError(res, 'CHANGE_PASSWORD_FAILED', 'Password change failed');
  }

  return (await res.json()) as Record<string, unknown>;
}

async function uploadFileWithBackend(path: string, fileUri: string): Promise<Record<string, unknown>> {
  const token = await requireToken();
  const formData = new FormData();
  const fileName = fileUri.split('/').pop() || `upload-${Date.now()}.jpg`;
  const lower = fileName.toLowerCase();
  const contentType =
    lower.endsWith('.pdf')
      ? 'application/pdf'
      : lower.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: contentType,
  } as unknown as Blob);

  const res = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    await throwApiError(res, 'FILE_UPLOAD_FAILED', `Upload failed for ${path}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function uploadNotesOcrWithBackend(fileUri: string): Promise<Record<string, unknown>> {
  return uploadFileWithBackend('/upload-notes-ocr', fileUri);
}

export async function solveAssignmentWithBackend(fileUri: string): Promise<Record<string, unknown>> {
  return uploadFileWithBackend('/solve-assignment', fileUri);
}

export async function uploadGenericFileWithBackend(fileUri: string): Promise<Record<string, unknown>> {
  return uploadFileWithBackend('/upload', fileUri);
}

export async function callApcEndpointWithBackend(
  action: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const cleaned = action.trim().replace(/^\/+/, '');
  if (!cleaned) {
    throw new ApiError('APC action is required.', 'APC_ACTION_MISSING');
  }

  const token = await requireToken();
  const res = await fetch(buildApiUrl(`/apc/${cleaned}`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await throwApiError(res, 'APC_CALL_FAILED', `APC call failed for ${cleaned}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

interface ChatRequestBody {
  message: string;
  response_mode?: ResponseMode;
  session_id?: number;
}

interface ChatResponse {
  text: string;
  sessionId?: number;
}

export async function getSessionsWithBackend(): Promise<SessionSummary[]> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/sessions'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'SESSIONS_FETCH_FAILED', 'Sessions fetch failed');
  }

  const data = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => ({
      id: Number(row.id || 0),
      title: typeof row.title === 'string' ? row.title : undefined,
      created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
      updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0);
}

export async function getHistoryWithBackend(sessionId?: number): Promise<ChatHistoryItem[]> {
  const token = await requireToken();
  const query = typeof sessionId === 'number' ? `?session_id=${sessionId}` : '';
  const res = await fetch(buildApiUrl(`/history${query}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'HISTORY_FETCH_FAILED', 'History fetch failed');
  }

  const data = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((row) => {
    const sender = typeof row.sender === 'string' ? row.sender.toLowerCase() : '';
    const text = typeof row.text === 'string' ? row.text : undefined;

    return {
      id: typeof row.id === 'number' ? row.id : undefined,
      user_message:
        typeof row.user_message === 'string'
          ? row.user_message
          : sender === 'user'
            ? text
            : undefined,
      ai_response:
        typeof row.ai_response === 'string'
          ? row.ai_response
          : sender === 'ai'
            ? text
            : undefined,
      timestamp:
        typeof row.timestamp === 'string'
          ? row.timestamp
          : typeof row.created_at === 'string'
            ? row.created_at
            : undefined,
    };
  });
}

export async function renameSessionWithBackend(sessionId: number, title: string): Promise<void> {
  const token = await requireToken();
  const query = `?title=${encodeURIComponent(title)}`;
  const res = await fetch(buildApiUrl(`/sessions/${sessionId}${query}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'SESSION_RENAME_FAILED', 'Session rename failed');
  }
}

export async function deleteSessionWithBackend(sessionId: number): Promise<void> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl(`/sessions/${sessionId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'SESSION_DELETE_FAILED', 'Session delete failed');
  }
}

export async function clearAllSessionsWithBackend(): Promise<void> {
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/sessions'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    await throwApiError(res, 'SESSIONS_CLEAR_FAILED', 'Sessions clear failed');
  }
}

export async function uploadProfilePictureWithBackend(fileUri: string): Promise<string> {
  const token = await requireToken();
  const formData = new FormData();

  formData.append('file', {
    uri: fileUri,
    name: `avatar-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(buildApiUrl('/upload-profile-picture'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    await throwApiError(res, 'AVATAR_UPLOAD_FAILED', 'Avatar upload failed');
  }

  const data = (await res.json()) as Record<string, unknown>;
  return String(data.url || data.profile_picture_url || '');
}

export interface GeneratedQuestion {
  question: string;
  options?: string[];
  correct_answer?: string;
  type?: string;
  subject?: string;
  semester?: number;
}

interface BackendSubjectCatalogItem {
  code: string;
  semester?: number;
  aliases: string[];
}

const BACKEND_SUBJECT_CATALOG: BackendSubjectCatalogItem[] = [
  { code: 'MCS-024', semester: 3, aliases: ['data structures', 'dsa', 'algorithms'] },
  { code: 'MCS-023', semester: 3, aliases: ['database management', 'dbms', 'sql', 'database'] },
  { code: 'MCS-022', semester: 4, aliases: ['operating systems', 'os', 'deadlocks'] },
  { code: 'MCS-021', semester: 4, aliases: ['computer networks', 'networking', 'cn'] },
  { code: 'MCS-011', semester: 2, aliases: ['mathematics ii', 'math', 'statistics'] },
  { code: 'MCS-207', semester: 3, aliases: ['web technologies', 'web tech', 'react', 'javascript'] },
];

function normalizeForSubjectMatch(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ');
}

export function resolveBackendSubjectCode(subject: string, semester?: number): string {
  const normalized = normalizeForSubjectMatch(subject);
  if (!normalized) return subject;

  let bestCode: string | null = null;
  let bestScore = -1;

  for (const item of BACKEND_SUBJECT_CATALOG) {
    let score = 0;
    if (typeof semester === 'number' && item.semester === semester) {
      score += 3;
    }

    for (const aliasRaw of item.aliases) {
      const alias = normalizeForSubjectMatch(aliasRaw);
      if (!alias) continue;

      if (normalized === alias) {
        score += 10;
      } else if (normalized.includes(alias) || alias.includes(normalized)) {
        score += 6;
      } else {
        const words = alias.split(' ').filter(Boolean);
        const overlap = words.filter((w) => normalized.includes(w)).length;
        score += overlap;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCode = item.code;
    }
  }

  return bestScore >= 4 && bestCode ? bestCode : subject;
}

function normalizeQuestionArray(data: unknown): GeneratedQuestion[] {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { questions?: unknown[] })?.questions)
      ? ((data as { questions?: unknown[] }).questions as unknown[])
      : [];

  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      const q = String(r.question || '').trim();
      if (!q) return null;
      return {
        question: q,
        options: Array.isArray(r.options) ? r.options.map((x) => String(x)) : undefined,
        correct_answer: typeof r.correct_answer === 'string' ? r.correct_answer : undefined,
        type: typeof r.type === 'string' ? r.type : undefined,
        subject: typeof r.subject === 'string' ? r.subject : undefined,
        semester: typeof r.semester === 'number' ? r.semester : undefined,
      } as GeneratedQuestion;
    })
    .filter(Boolean) as GeneratedQuestion[];
}

export async function generateQuizWithBackend(
  subject: string,
  semester: number,
  count = 15
): Promise<GeneratedQuestion[]> {
  const resolvedSubject = resolveBackendSubjectCode(subject, semester);
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/generate-quiz'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject: resolvedSubject, semester, count }),
  });

  if (!res.ok) {
    await throwApiError(res, 'QUIZ_GENERATION_FAILED', 'Quiz generation failed');
  }

  const data = await res.json();
  return normalizeQuestionArray(data);
}

export async function generateExamWithBackend(
  subject: string,
  semester: number,
  mcqCount = 12,
  subjectiveCount = 2
): Promise<GeneratedQuestion[]> {
  const resolvedSubject = resolveBackendSubjectCode(subject, semester);
  const token = await requireToken();
  const res = await fetch(buildApiUrl('/generate-exam'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: resolvedSubject,
      semester,
      mcq_count: mcqCount,
      subjective_count: subjectiveCount,
    }),
  });

  if (!res.ok) {
    await throwApiError(res, 'EXAM_GENERATION_FAILED', 'Exam generation failed');
  }

  const data = await res.json();
  return normalizeQuestionArray(data);
}

export async function chatWithBackend(
  message: string,
  options?: { sessionId?: number; responseMode?: ResponseMode }
): Promise<ChatResponse> {
  const token = await requireToken();

  const body: ChatRequestBody = {
    message,
    response_mode: options?.responseMode || 'thinking',
  };
  if (typeof options?.sessionId === 'number') {
    body.session_id = options.sessionId;
  }

  const res = await fetch(buildApiUrl('/chat'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    await throwApiError(res, 'CHAT_FAILED', 'Backend request failed');
  }

  const data = await res.json();
  const responseText =
    (typeof data === 'string' && data) ||
    data?.response ||
    data?.answer ||
    data?.message ||
    data?.text ||
    '';

  if (!responseText) {
    throw new ApiError('Empty response from backend.', 'EMPTY_RESPONSE');
  }

  const rawSessionId =
    data?.session_id ||
    data?.sessionId ||
    data?.session?.id ||
    undefined;

  return {
    text: String(responseText),
    sessionId: typeof rawSessionId === 'number' ? rawSessionId : undefined,
  };
}
