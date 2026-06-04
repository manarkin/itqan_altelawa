export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type StudentType = 'undergrad' | 'postgrad';

export interface Gift {
  id: number;
  amount: number;
  message: string;
  giftType: 'box' | 'package' | 'envelope' | 'piggy';
  isOpened: boolean;
}

export interface ExamResults {
  theory: number;
  practical: 'PASS' | 'FAIL';
  averageTheory: number;
}

export interface User {
  firstName: string;
  lastName: string;
  role: Role;
  email: string;
  isEnrolled: boolean;
  sessionId: string;
  phone?: string;
  college?: string;
  degree?: string;
  cohort?: string;
  isSenior?: boolean;
  money: number;
  absencesExcused: number;
  absencesUnexcused: number;
  gifts: Gift[];
  examResults?: ExamResults;
  avatar?: string;
  level?: string;
}

export interface SessionStudent {
  id: string;
  name: string;
  money: number;
  avatar: string;
  absencesExcused: number;
  absencesUnexcused: number;
  email?: string;
  phone?: string;
  college?: string;
  cohort?: string;
  gifts?: Gift[];
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Announcement {
  id: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'link' | 'pdf' | 'poll';
  attachment?: string;
  date: string;
  author: string;
  pollOptions?: PollOption[];
  voted?: number; // stores option id voted by current user
}

export interface Session {
  id: string;
  name: string;
  teacher: {
    name: string;
    phone: string;
  };
  location: string;
  time: string;
  students: SessionStudent[];
  maxStudents: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN';
  announcements: Announcement[];
  themeColor?: string;
  themePhoto?: string;
  isPast?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  money: number;
  rank: number;
  avatar: string;
}

export interface SessionRequest {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN';
  date: string;
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  pendingRequests: number;
}

export interface GlobalStudent {
  name: string;
  phone: string;
  level: string;
  session: string;
  info: string;
}

export interface GlobalTeacher {
  name: string;
  phone: string;
  level: string;
  session: string;
  info: string;
}
