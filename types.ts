// types.ts

export interface BaseModel {
  id: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}


export interface User extends BaseModel {
  fullName: string;
  phone: string;
  email?: string;
  profilePictureUrl?: string;
  jobTitle?: string;
  organizationId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';
  //password?: string; // ← רק אם באמת יש צורך, לרוב לא מומלץ!

}

export interface Organization extends BaseModel {
  name: string;
}

export interface Membership extends BaseModel {
  userId: string;
  organizationId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';
  organization: Organization; // Populated by server
  user: User; // Populated by server
}

export interface Comment extends BaseModel {
  author: User; // Populated User object (id, fullName, avatar)
  content: string;
}

export type TaskStatus = 'מתוכנן' | 'בסיכון' | 'בתהליך' | 'תקוע' | 'הושלם';

// ---  שינוי: עדכון הממשק Task ---
export interface Task extends BaseModel {
  title: string;
  description?: string;
  assignees: User[]; // Populated array of User objects
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  expense?: number;
  status: TaskStatus;
  color: string;
  comments: Comment[]; // Populated array of Comment objects

  // --- שדות חדשים שנוספו ---
  displayOrder: number; // שדה לשמירת הסדר האנכי של המשימות
  type?: 'task' | 'milestone'; // סוג המשימה: רגילה או אבן דרך
  dependencies?: string[]; // מערך של מזהי משימות (task IDs) שהמשימה הזו תלויה בהן
}

// ---  שינוי: עדכון הממשק TaskPayload ---
export interface TaskPayload {
  title?: string;
  description?: string;
  assigneesIds?: string[];
  startDate?: string;
  endDate?: string;
  expense?: number;
  color?: string;
  status?: TaskStatus;

  // --- שדות חדשים שנוספו ---
  displayOrder?: number;
  type?: 'task' | 'milestone';
  dependencies?: string[];
}

export type ProjectStatus = 'מתוכנן' | 'בתהליך' | 'לקראת סיום' | 'בסיכון' | 'מוקפא' | 'הושלם';

export interface Project extends BaseModel {
  title: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  completionPercentage?: number; // <<-- הוסף שורה זו
  status: ProjectStatus;
  isArchived: boolean;
  teams: Team[]; // Populated array of Team objects
  teamLeads: User[]; // Populated array of User objects
  tasks?: Task[]; // Now optional, to be fetched on demand
  monthlyBudgets?: MonthlyBudget[]; // 💡 חדש: מערך של תקציבים חודשיים
  projectTeamLeads?: { user: User }[]; 


}

export interface MonthlyBudget extends BaseModel {
  projectId: string;
  year: number;
  month: number;
  incomeBudget: number;
  expenseBudget: number;
}

export interface ProjectPayload {
    title: string;
    description: string;
    teamLeads: string[];
    startDate: string;
    endDate: string;
    teamIds?: string[];
    monthlyBudgets?: MonthlyBudgetPayload[];
    isArchived?: boolean;
}

export interface MonthlyBudgetPayload {
    year: number;
    month: number;
    incomeBudget: number;
    expenseBudget: number;
}

export type FinanceEntryType = 'INCOME' | 'EXPENSE';

export type FinanceEntryPayload = Omit<FinanceEntry, 'id' | 'netAmount' | 'projectTitle' | 'createdAt' | 'updatedAt'>;

export interface FinanceEntry extends BaseModel {
    type: FinanceEntryType;
    amount: number; // סכום ברוטו
    vatPercentage?: number; // 💡 חדש
    deductions?: number; // 💡 חדש
    netAmount?: number; // 💡 חדש
    status?: string; // 💡 חדש
    description: string;
    notes?: string; // 💡 חדש
    date: string; // ISO String
    projectId?: string;
    taskId?: string;
    projectTitle?: string;
}

export interface FinanceSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    totalProjectBudget: number; // 💡 חדש
}

export interface Team extends BaseModel {
  name: string;
  organizationId: string;
  leadIds: string[];
  memberIds: string[];
  leads?: User[];
  members?: User[];
  teamLeads?: { userId: string, user: User }[];
}

export interface TeamPayload {
  name: string;
  leadIds: string[];
  memberIds: string[];
}

export interface Message extends BaseModel {
  sender: User; // Populated User object
  text: string;
  timestamp?: string; // From WebSocket, may differ slightly from createdAt.
}

export interface Conversation extends BaseModel {
  type: 'private' | 'group';
  participants: User[]; // Populated array of User objects
  name?: string; // For group chats only
  avatarUrl?: string; // For group chats only
  messages: Message[];
  unreadCount: number; // Calculated per-user by the server
}

export interface Notification extends BaseModel {
  type: 'comment' | 'assignment' | 'status_change' | 'deadline';
  text: string;
  read: boolean;
  link: string;
  timestamp: string; // ISO String
}
