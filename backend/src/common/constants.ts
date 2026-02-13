// ============================================================
// Early Warning Thresholds
// ============================================================
export const EARLY_WARNING = {
  MIN_GPA: 2.0,
  MIN_ABSENCE_COUNT: 3,
} as const;

// ============================================================
// Risk Level Thresholds
// ============================================================
export const RISK_THRESHOLDS = {
  HIGH_GPA: 2.0,
  HIGH_BEHAVIOR: 60,
  MEDIUM_GPA: 2.5,
  MEDIUM_BEHAVIOR: 80,
} as const;

// ============================================================
// Behavior Score
// ============================================================
export const BEHAVIOR_SCORE = {
  BASE: 100,
  ABSENT_DEDUCTION: 5,
  LATE_DEDUCTION: 2,
  MIN: 0,
  MAX: 100,
} as const;

// ============================================================
// Attendance
// ============================================================
export const ATTENDANCE = {
  LOW_RATE_THRESHOLD: 80,
  PERIODS: { MIN: 0, MAX: 8 },
  THAI_UTC_OFFSET_HOURS: 7,
} as const;

// ============================================================
// Upload Limits
// ============================================================
export const UPLOAD = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
} as const;

// ============================================================
// Auth
// ============================================================
export const AUTH = {
  JWT_EXPIRY: '7d',
  MIN_PASSWORD_LENGTH: 6,
  COOKIE_NAME: 'access_token',
  COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// ============================================================
// Pagination Defaults
// ============================================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
} as const;

// ============================================================
// GPA
// ============================================================
export const GPA = {
  MAX_SCALE: 4.0,
  LOW_SCORE_RATIO: 0.5,
} as const;
