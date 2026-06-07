// Global in-memory store — shared across all Next.js API routes in the same process
// This solves the problem of DEMO_USERS being separate objects in register vs login routes

import crypto from 'crypto';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hashedPassword: string;
  createdAt: string;
}

interface OTPRecord {
  otp: string;
  expiresAt: number;
  newPassword?: string;
}

// Attendance record
interface AttendanceRecord {
  classId: string;
  date: string;
  studentId: string;
  status: 'Present' | 'Absent';
}

interface Material {
  id: string;
  classId: string;
  title: string;
  subject: string;
  content: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Use globalThis so the same object is reused across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __EDUBRIDGE_STORE__: {
    users: Map<string, User>;
    otps: Map<string, OTPRecord>;
    attendance: AttendanceRecord[];
    materials: Material[];
    classes: { id: string; name: string; subject: string; schedule: string }[];
  } | undefined;
}

if (!globalThis.__EDUBRIDGE_STORE__) {
  globalThis.__EDUBRIDGE_STORE__ = {
    users: new Map(),
    otps: new Map(),
    attendance: [],
    materials: [],
    classes: [
      { id: 'c1', name: 'CS-3A', subject: 'Data Structures', schedule: 'Mon/Thu/Fri 9:00 AM' },
      { id: 'c2', name: 'CS-3B', subject: 'Mathematics', schedule: 'Tue/Thu 1:00 PM' },
      { id: 'c3', name: 'CS-4A', subject: 'English Literature', schedule: 'Tue/Fri 1:00 PM' },
    ],
  };
}

export const store = globalThis.__EDUBRIDGE_STORE__!;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const N = 16384;
  const r = 8;
  const p = 1;
  const keyLen = 64;
  const derivedKey = crypto.scryptSync(password, salt, keyLen, { N, r, p }).toString('hex');
  return `scrypt$${N}$${r}$${p}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = parts[4];
    const expected = Buffer.from(parts[5], 'hex');

    const actual = crypto.scryptSync(password, salt, expected.length, { N, r, p });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function makeToken(email: string, userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: email, uid: userId, exp: Date.now() + 86400000 })
  ).toString('base64url');
  const sig = crypto.createHash('sha256').update(payload + 'jwt_secret_edubridge').digest('hex').slice(0, 16);
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { sub: string; uid: string; exp: number } | null {
  try {
    const parts = token.split('.');
    let payloadPart = parts[0];
    if (parts.length === 3) {
      payloadPart = parts[1];
    }
    const data = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    let exp = data.exp;
    if (exp < 10000000000) {
      exp = exp * 1000;
    }
    if (exp < Date.now()) return null;
    return {
      sub: data.sub,
      uid: data.uid || data.sub,
      exp: exp
    };
  } catch {
    return null;
  }
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
