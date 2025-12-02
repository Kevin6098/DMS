import { apiService, ApiResponse } from './api';

// Types
export interface Reminder {
  id: number;
  file_id: number;
  user_id: number;
  organization_id: number;
  reminder_datetime: string;
  title: string | null;
  note: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'notified' | 'completed' | 'dismissed';
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrence_end_date: string | null;
  notified_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  file_name?: string;
  file_type?: string;
  file_size?: number;
  folder_id?: number;
  folder_name?: string;
  storage_path?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
}

export interface ReminderCreateRequest {
  fileId: number;
  reminderDatetime: string;
  title?: string;
  note?: string;
  priority?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
}

export interface ReminderUpdateRequest {
  reminderDatetime?: string;
  title?: string;
  note?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'notified' | 'completed' | 'dismissed';
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
}

export interface TodoDocument extends Reminder {
  file_id: number;
}

export interface TodoSummary {
  overdue: number;
  today: number;
  upcoming: number;
  total: number;
}

export interface PendingRemindersResponse {
  reminders: Reminder[];
  dueCount: number;
}

export interface TodoDocumentsResponse {
  documents: TodoDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: TodoSummary;
}

// Reminder Service
export const reminderService = {
  // Get all reminders
  getReminders: async (
    status?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ reminders: Reminder[]; pagination: any }>> => {
    const params: any = { page, limit };
    if (status) params.status = status;
    return apiService.get('/reminders', params);
  },

  // Get pending reminders (for notification bell)
  getPendingReminders: async (): Promise<ApiResponse<PendingRemindersResponse>> => {
    return apiService.get('/reminders/pending');
  },

  // Get to-do documents
  getTodoDocuments: async (
    page: number = 1,
    limit: number = 20,
    filter: 'all' | 'overdue' | 'today' | 'upcoming' = 'all'
  ): Promise<ApiResponse<TodoDocumentsResponse>> => {
    return apiService.get('/reminders/todo-documents', { page, limit, filter });
  },

  // Create a reminder
  createReminder: async (data: ReminderCreateRequest): Promise<ApiResponse<{ id: number }>> => {
    return apiService.post('/reminders', data);
  },

  // Update a reminder
  updateReminder: async (reminderId: number, data: ReminderUpdateRequest): Promise<ApiResponse<void>> => {
    return apiService.put(`/reminders/${reminderId}`, data);
  },

  // Mark reminder as completed
  completeReminder: async (reminderId: number): Promise<ApiResponse<void>> => {
    return apiService.post(`/reminders/${reminderId}/complete`, {});
  },

  // Dismiss a reminder
  dismissReminder: async (reminderId: number): Promise<ApiResponse<void>> => {
    return apiService.post(`/reminders/${reminderId}/dismiss`, {});
  },

  // Delete a reminder
  deleteReminder: async (reminderId: number): Promise<ApiResponse<void>> => {
    return apiService.delete(`/reminders/${reminderId}`);
  },

  // Get reminders for a specific file
  getFileReminders: async (fileId: number): Promise<ApiResponse<Reminder[]>> => {
    return apiService.get(`/reminders/file/${fileId}`);
  },

  // Helper: Format reminder datetime for display
  formatReminderTime: (datetime: string): string => {
    const date = new Date(datetime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (reminderDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    } else if (reminderDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${timeStr}`;
    } else if (reminderDate < today) {
      const daysAgo = Math.floor((today.getTime() - reminderDate.getTime()) / (24 * 60 * 60 * 1000));
      if (daysAgo === 1) {
        return `Yesterday at ${timeStr}`;
      }
      return `${daysAgo} days overdue`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ` at ${timeStr}`;
    }
  },

  // Helper: Check if reminder is overdue
  isOverdue: (datetime: string): boolean => {
    return new Date(datetime) < new Date();
  },

  // Helper: Check if reminder is due today
  isDueToday: (datetime: string): boolean => {
    const date = new Date(datetime);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  },

  // Helper: Get priority color
  getPriorityColor: (priority: string): string => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  },

  // Helper: Get status badge class
  getStatusBadgeClass: (datetime: string, status: string): string => {
    if (status === 'completed') return 'badge-success';
    if (status === 'dismissed') return 'badge-secondary';
    if (reminderService.isOverdue(datetime)) return 'badge-danger';
    if (reminderService.isDueToday(datetime)) return 'badge-warning';
    return 'badge-info';
  },
};

