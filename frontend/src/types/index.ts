export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: Role;
  organizationId: number | null;
  organizationName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Entry {
  id: number;
  user_id: number;
  email?: string;
  full_name?: string;
  entry_name: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  entry_type: "Debit" | "Credit";
  payment_method: "Cash" | "Online" | "Card" | "UPI";
  created_at: string;
}

export interface EntrySummary {
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EntryResponse {
  items: Entry[];
  summary: EntrySummary;
  pagination: PaginationMeta;
}

export interface UserRow {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: number | boolean;
  role: Role;
  created_at: string;
  entry_count: number;
  total_credit: number;
  total_debit: number;
}

export interface ManagedUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
}

export interface AdminReportResponse {
  summary: {
    totalEntries: number;
    totalCredit: number;
    totalDebit: number;
    balance: number;
  };
  users: Array<{
    user_id: number;
    email: string;
    entry_count: number;
    total_credit: number;
    total_debit: number;
  }>;
}

export interface AuditLogItem {
  id: number;
  action: string;
  target_type: string;
  target_id?: number | null;
  actor_role: string;
  actor_name: string;
  actor_email: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}
