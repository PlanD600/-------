
import { Project, Task, FinanceEntry, FinanceSummary, PaginatedResponse, User, Membership, Team, Conversation, Message, Comment, ProjectPayload, TaskPayload, TeamPayload } from '../types';

const BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwtToken');
  const orgId = localStorage.getItem('currentOrgId');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (orgId) {
    headers['X-Organization-Id'] = orgId;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
    if (response.status === 204) {
        return; // No content to parse
    }
    // Try to parse JSON, but if the body is empty, return an empty object.
    const text = await response.text();
    const resJson = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const errorMessage = resJson.message || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).errors = resJson.errors;
        throw error;
    }
    return resJson;
};

const buildQueryString = (params: Record<string, any>): string => {
    const usp = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            usp.append(key, params[key].toString());
        }
    }
    const queryString = usp.toString();
    return queryString ? `?${queryString}` : '';
}


// AUTH
export const register = (data: { fullName: string; phone: string; organizationName: string; }) => 
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const sendOtp = (phone: string) => 
  fetch(`${BASE_URL}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  }).then(handleResponse);

export const verifyOtp = (phone: string, otpCode: string): Promise<{ token: string, user: User, memberships: Membership[] }> => 
  fetch(`${BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otpCode }),
  }).then(handleResponse);

export const getMyMemberships = (): Promise<Membership[]> => 
  fetch(`${BASE_URL}/auth/me/memberships`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const getMyProfile = (): Promise<User> => 
  fetch(`${BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);
  
export const updateMyProfile = (data: Partial<User>): Promise<User> =>
  fetch(`${BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

// PROJECTS
export const getProjects = (page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<Project>> => {
    const query = buildQueryString({ page, limit, sortBy, sortOrder });
    return fetch(`${BASE_URL}/projects${query}`, {
        headers: getAuthHeaders(),
    }).then(handleResponse);
}

export const createProject = (projectData: ProjectPayload): Promise<Project> => {
    return fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    }).then(handleResponse);
};
  
export const updateProject = (projectId: string, projectData: Partial<ProjectPayload>): Promise<Project> => {
    return fetch(`${BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    }).then(handleResponse);
};
  
export const archiveProject = (projectId: string, isArchived: boolean): Promise<Project> =>
  fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isArchived }),
  }).then(handleResponse);

export const deleteProject = (projectId: string): Promise<void> =>
  fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);


// TASKS
export const getTasksForProject = (projectId: string, page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<Task>> => {
  const query = buildQueryString({ page, limit, sortBy, sortOrder });
  return fetch(`${BASE_URL}/projects/${projectId}/tasks${query}`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);
}

export const createTask = (projectId: string, taskData: TaskPayload): Promise<Task> => 
  fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  }).then(handleResponse);
  
export const updateTask = (projectId: string, taskId: string, taskData: Partial<TaskPayload>): Promise<Task> =>
    fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData),
    }).then(handleResponse);

export const deleteTask = (projectId: string, taskId: string): Promise<void> =>
    fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    }).then(handleResponse);

export const addTaskComment = (projectId: string, taskId: string, content: string): Promise<Comment> =>
    fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
    }).then(handleResponse);


// FINANCE API
export const getFinanceSummary = (projectId: string = 'all'): Promise<FinanceSummary> => 
  fetch(`${BASE_URL}/finance/summary?projectId=${projectId}`, {
    headers: getAuthHeaders()
  }).then(handleResponse);

export const getFinanceEntries = (projectId: string = 'all', page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<FinanceEntry>> => {
    const query = buildQueryString({ projectId, page, limit, sortBy, sortOrder });
    return fetch(`${BASE_URL}/finance/entries${query}`, {
        headers: getAuthHeaders()
    }).then(handleResponse);
}
export const createFinanceEntry = (entryData: Omit<FinanceEntry, 'id' | 'createdAt' | 'updatedAt' | 'projectTitle'>): Promise<FinanceEntry> =>
  fetch(`${BASE_URL}/finance/entries`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData),
  }).then(handleResponse);
  
// USERS & TEAMS
export const getUsersInOrg = (page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<Membership>> => {
    const query = buildQueryString({ page, limit, sortBy, sortOrder });
    return fetch(`${BASE_URL}/users${query}`, { headers: getAuthHeaders() }).then(handleResponse);
}
export const inviteUser = (data: { fullName: string; phone: string; jobTitle: string; role: Membership['role'] }): Promise<Membership> =>
  fetch(`${BASE_URL}/users/invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
  
export const updateUserRole = (userId: string, role: Membership['role']): Promise<Membership> =>
  fetch(`${BASE_URL}/users/${userId}/membership`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  }).then(handleResponse);

export const removeUserFromOrg = (userId: string): Promise<void> =>
  fetch(`${BASE_URL}/users/${userId}/membership`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const getTeams = (page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<Team>> => {
    const query = buildQueryString({ page, limit, sortBy, sortOrder });
    return fetch(`${BASE_URL}/teams${query}`, { headers: getAuthHeaders() }).then(handleResponse);
}
export const createTeam = (teamData: TeamPayload): Promise<Team> =>
  fetch(`${BASE_URL}/teams`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(teamData),
  }).then(handleResponse);
  
export const updateTeam = (teamId: string, teamData: Partial<TeamPayload>): Promise<Team> =>
  fetch(`${BASE_URL}/teams/${teamId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(teamData),
  }).then(handleResponse);

export const deleteTeam = (teamId: string): Promise<void> =>
  fetch(`${BASE_URL}/teams/${teamId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);
  
// CONVERSATIONS
export const getConversations = (): Promise<Conversation[]> =>
  fetch(`${BASE_URL}/conversations`, { headers: getAuthHeaders() }).then(handleResponse);
  
export const createConversation = (data: { type: 'private' | 'group', participantIds: string[], name?: string, avatarUrl?: string }): Promise<Conversation> =>
  fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const getMessagesForConversation = (conversationId: string, page = 1, limit = 50): Promise<{ messages: Message[], totalPages: number, currentPage: number }> =>
  fetch(`${BASE_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, { headers: getAuthHeaders() }).then(handleResponse);