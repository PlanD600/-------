
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

export type TaskStatus = 'מתוכנן' | 'בתהליך' | 'תקוע' | 'הושלם';

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
}

export interface TaskPayload {
    title?: string;
    description?: string;
    assigneesIds?: string[];
    startDate?: string;
    endDate?: string;
    expense?: number;
    color?: string;
    status?: TaskStatus;
}

export type ProjectStatus = 'מתוכנן' | 'בתהליך' | 'לקראת סיום' | 'בסיכון' | 'מוקפא' | 'הושלם';

export interface Project extends BaseModel {
  title: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  budget?: number;
  status: ProjectStatus;
  isArchived: boolean;
  team: Team[]; // Populated array of Team objects
  teamLeads: User[]; // Populated array of User objects
  tasks?: Task[]; // Now optional, to be fetched on demand
}

export interface ProjectPayload {
    title?: string;
    description?: string;
    teamLeads?: string[]; // Renamed from teamLeadIds for clarity and API spec alignment
    startDate?: string;
    endDate?: string;
    budget?: number;
}


export type FinanceEntryType = 'INCOME' | 'EXPENSE';

export interface FinanceEntry extends BaseModel {
  type: FinanceEntryType;
  amount: number;
  description: string;
  date: string; // ISO String
  projectId?: string;
  taskId?: string;
  projectTitle?: string; 
}

export interface FinanceSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
}

export interface Team extends BaseModel {
  name: string;
  leadIds: string[];
  memberIds: string[];
  leads?: User[];
  members?: User[];
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