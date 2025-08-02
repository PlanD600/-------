// src/services/api.ts

import { Organization, Project, Task, FinanceEntry, FinanceSummary, PaginatedResponse, User, Membership, Team, Conversation, Message, Comment, ProjectPayload, TaskPayload, TeamPayload } from '../types';

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

const handleFileResponse = async (response: Response): Promise<Blob> => {
    if (!response.ok) {
        try {
            const errorText = await response.text();
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
        } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }
    return response.blob();
};

const handleResponse = async (response: Response) => {
  console.log("API Response Status:", response.status);
  const clonedResponse = response.clone();
  const responseBodyText = await clonedResponse.text();
  console.log("API Response Body (Raw Text):", responseBodyText);
  if (response.status === 204) {
    return;
  }
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

// ORGANIZATIONS 
export const createOrganization = (data: { name: string }): Promise<Organization> => {
  return fetch(`${BASE_URL}/organizations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
};

export const updateOrganization = (id: string, data: { name: string }): Promise<Organization> => {
  return fetch(`${BASE_URL}/organizations/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
};

export const deleteOrganization = (id: string): Promise<{ message: string }> => {
  return fetch(`${BASE_URL}/organizations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);
};


// PROJECTS
export const getProjects = (
    page = 1,
    limit = 25,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    signal?: AbortSignal,
    isArchived?: boolean
): Promise<PaginatedResponse<Project>> => {
    const query = buildQueryString({
        page,
        limit,
        sortBy,
        sortOrder,
        isArchived
    });
    return fetch(`${BASE_URL}/projects${query}`, {
        headers: getAuthHeaders(),
        signal,
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
export const getTasksForProject = (projectId: string, page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc', signal?: AbortSignal): Promise<PaginatedResponse<Task>> => {
    const query = buildQueryString({ page, limit, sortBy, sortOrder });
    return fetch(`${BASE_URL}/projects/${projectId}/tasks${query}`, {
        headers: getAuthHeaders(),
        signal,
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
export const getFinanceSummary = (projectId?: string): Promise<FinanceSummary> => {
  const query = buildQueryString({ projectId });
  return fetch(`${BASE_URL}/finances/summary${query}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const getFinanceEntries = (projectId?: string, page = 1, limit = 25, sortBy = 'date', sortOrder = 'desc'): Promise<PaginatedResponse<FinanceEntry>> => {
  const query = buildQueryString({ projectId, page, limit, sortBy, sortOrder });
  return fetch(`${BASE_URL}/finances/entries${query}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const createFinanceEntry = (data: Omit<FinanceEntry, 'id' | 'netAmount' | 'projectTitle' | 'createdAt' | 'updatedAt'>): Promise<FinanceEntry> => {
  return fetch(`${BASE_URL}/finances/entries`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
};

export const updateFinanceEntry = (entryId: string, data: Partial<FinanceEntry>): Promise<FinanceEntry> => {
  return fetch(`${BASE_URL}/finances/${entryId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
};

export const deleteFinanceEntry = (entryId: string): Promise<void> => {
  return fetch(`${BASE_URL}/finances/${entryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);
};

export const resetProjectFinances = (projectId: string): Promise<void> => {
  return fetch(`${BASE_URL}/finances/${projectId}/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }).then(handleResponse);
};

export const restoreProjectFinances = (projectId: string, entryId: string): Promise<void> => {
  return fetch(`${BASE_URL}/projects/${projectId}/finances/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ entryId }),
  }).then(handleResponse);
};

// 💡 פונקציה חדשה להורדת PDF
export const generateFinancePDF = (projectId?: string): Promise<Blob> => {
    const query = buildQueryString({ projectId });
    return fetch(`${BASE_URL}/finances/pdf${query}`, { headers: getAuthHeaders() })
        .then(handleFileResponse);
};

// USERS & TEAMS
export const getUsersInOrg = (page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc', signal?: AbortSignal): Promise<PaginatedResponse<Membership>> => {
  const query = buildQueryString({ page, limit, sortBy, sortOrder });
  return fetch(`${BASE_URL}/users${query}`, { headers: getAuthHeaders(), signal }).then(handleResponse);
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

export const getTeams = (page = 1, limit = 25, sortBy?: string, sortOrder?: 'asc' | 'desc', signal?: AbortSignal): Promise<PaginatedResponse<Team>> => {
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
export const getConversations = (signal?: AbortSignal): Promise<Conversation[]> =>
  fetch(`${BASE_URL}/conversations`, { headers: getAuthHeaders(), signal }).then(handleResponse);

export const createConversation = (data: { type: 'private' | 'group', participantIds: string[], name?: string, avatarUrl?: string }): Promise<Conversation> =>
  fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const getMessagesForConversation = (conversationId: string, page = 1, limit = 50): Promise<{ messages: Message[], totalPages: number, currentPage: number }> =>
  fetch(`${BASE_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, { headers: getAuthHeaders() }).then(handleResponse);