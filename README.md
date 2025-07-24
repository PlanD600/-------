# ProjectFlow - Backend API Specification

## 1. Introduction

This document provides the technical specification for the ProjectFlow backend REST API. It is written from the perspective of the frontend client and outlines all the necessary endpoints, data models, and real-time communication protocols required for the application to function correctly.

### Target Audience

This specification is intended for **backend developers** who are building the server-side logic for the ProjectFlow application.

### General Principles

-   **Format**: All API communication will be done via a RESTful interface using JSON.
-   **Authentication**: All requests, except for `/auth/register` and `/auth/otp/**`, must be authenticated using a `Bearer` token (JWT) in the `Authorization` header.
-   **Organization Context**: All requests operating within an organization's context (e.g., fetching projects, users, etc.) must include an `X-Organization-Id` header. The client is responsible for storing and sending this header after the user selects an organization.
-   **Error Handling**: The server should return meaningful HTTP status codes. Errors should be returned in a consistent JSON format:
    ```json
    {
      "message": "A descriptive error message for the user or developer."
    }
    ```

---

## 2. Core Flows

### User Onboarding (Registration & Login)

1.  **Registration (Optional)**: If the user is new, they first register with their full name, phone number, and organization name.
    -   `POST /api/auth/register`
2.  **Request OTP**: The user enters their phone number to log in.
    -   `POST /api/auth/otp/send`
3.  **Verify OTP**: The user submits the received OTP code along with their phone number.
    -   `POST /api/auth/otp/verify`
4.  **Receive Token & Memberships**: On successful verification, the server returns a JWT `token`, `user` details, and a list of their `memberships`. The client stores the token (e.g., in `localStorage`) for subsequent authenticated requests.
5.  **Set Initial Organization**: The client automatically sets the first organization from the `memberships` list as the active one and stores its ID to be sent in the `X-Organization-Id` header.

### Switching Organizations

1.  The user selects a different organization from a dropdown menu in the UI.
2.  The client updates the stored `currentOrgId` and reloads the relevant data (e.g., projects).
3.  All subsequent requests will use the new ID in the `X-Organization-Id` header.

---

## 3. API Endpoint Specification

### 3.1 Authentication (`/api/auth`)

| Action                      | Method & Path               | Description                                                                                             | Request Body                                                                      | Success Response (200 OK)                                                               |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Register**                | `POST /auth/register`       | Creates a new user and their initial organization. Automatically sends an OTP.                          | `{ fullName: string, phone: string, organizationName: string }`                   | `{ message: "Registration successful. Please verify OTP." }`                            |
| **Send OTP for Login**      | `POST /auth/otp/send`       | Sends an OTP to an existing user's phone number for login.                                              | `{ phone: string }`                                                               | `{ message: "OTP sent successfully." }`                                                 |
| **Verify OTP**              | `POST /auth/otp/verify`     | Verifies the OTP and returns a JWT token, user object, and their memberships.                           | `{ phone: string, otpCode: string }`                                              | `{ token: string, user: User, memberships: Membership[] }`                              |
| **Get My Memberships**      | `GET /auth/me/memberships`  | Fetches the list of organizations the authenticated user belongs to. Requires authentication.           | (None)                                                                            | `Membership[]`                                                                          |
| **Get My Profile**          | `GET /auth/me`              | Fetches the profile of the currently authenticated user.                                                | (None)                                                                            | `User`                                                                                  |
| **Update My Profile**       | `PUT /auth/me`              | Updates the profile of the authenticated user.                                                          | `{ fullName?: string, jobTitle?: string, email?: string, profilePictureUrl?: string }` | `User` (the updated user object)                                                        |

### 3.2 Projects (`/api/projects`)

*Requires Authentication and `X-Organization-Id` header.*

| Action                            | Method & Path                 | Description                                                                                             | Request Body                                                                                                         | Success Response                                                              |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Get All Projects**              | `GET /projects`               | Retrieves a list of all projects (both active and archived) for the current organization.               | (None)                                                                                                               | `Project[]`                                                                   |
| **Create Project**                | `POST /projects`              | Creates a new project. `ADMIN` or higher role required.                                                 | `{ title: string, description?: string, teamLeads: string[], startDate?: string, endDate?: string, budget?: number }` | `Project` (the newly created project) (201 Created)                           |
| **Update Project**                | `PUT /projects/:projectId`    | Updates an existing project's details. `ADMIN` or `TEAM_LEADER` of the project required.                | `{ title: string, description?: string, teamLeads: string[], startDate?: string, endDate?: string, budget?: number }` | `Project` (the updated project)                                               |
| **Archive/Unarchive Project**     | `PUT /projects/:projectId`    | Updates the `isArchived` status of a project.                                                           | `{ isArchived: boolean }`                                                                                            | `Project` (the updated project)                                               |
| **Delete Project**                | `DELETE /projects/:projectId` | Permanently deletes a project. `ADMIN` or higher role required.                                         | (None)                                                                                                               | `{ message: "Project deleted successfully." }` (200 OK) or (204 No Content) |

### 3.3 Tasks (`/api/projects/:projectId/tasks`)

*Requires Authentication and `X-Organization-Id` header.*

| Action                      | Method & Path                           | Description                                                                          | Request Body                                                                                                                              | Success Response                                         |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Get Tasks for Project**   | `GET /projects/:projectId/tasks`        | Retrieves all tasks for a specific project.                                          | (None)                                                                                                                                    | `Task[]`                                                 |
| **Create Task**             | `POST /projects/:projectId/tasks`       | Creates a new task within a project. `ADMIN` or `TEAM_LEADER` of the project.        | `{ title: string, description?: string, assigneesIds?: string[], startDate?: string, endDate?: string, expense?: number, color: string }` | `Task` (the newly created task) (201 Created)           |
| **Update Task**             | `PUT /projects/:projectId/tasks/:taskId`| Updates an existing task. Assignees can update `status`. The project's assigned Team Leader(s), Admins, and Super Admins can update all fields.    | `{ title?: string, description?: string, assigneesIds?: string[], status?: TaskStatus, startDate?: string, endDate?: string, ... }`       | `Task` (the updated task)                                |
| **Delete Task**             | `DELETE /projects/:projectId/tasks/:taskId`| Deletes a task. `ADMIN` or `TEAM_LEADER` of the project.                            | (None)                                                                                                                                    | `{ message: "Task deleted successfully." }` (204 No Content) |
| **Add Comment to Task**     | `POST /projects/:projectId/tasks/:taskId/comments` | Adds a comment to a task. Any project member can comment.                  | `{ content: string }`                                                                                                                     | `Comment` (the new comment) (201 Created)                |

### 3.4 Users & Teams (`/api/`)

*Requires Authentication and `X-Organization-Id` header. Mostly restricted to `ADMIN` roles.*

| Action                      | Method & Path               | Description                                                                                               | Request Body                                                                      | Success Response                                                                |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Get All Users in Org**    | `GET /users`                | Retrieves a list of all user memberships in the current organization. `ADMIN` role required.                         | (None)                                                                            | `Membership[]`                                                                        |
| **Invite User**             | `POST /users/invite`        | Invites a new user to the organization. `ADMIN` role required.                                            | `{ fullName: string, phone: string, jobTitle: string, role: Membership['role'] }`        | `User` (the newly created user object, status 'pending') (201 Created)          |
| **Update User Role**| `PUT /users/:userId/membership`     | Updates a user's role within the organization. `ADMIN` role required. Cannot edit a user with a higher/equal role.      | `{ role: Membership['role'] }`                                      | `Membership` (the updated membership)                                                       |
| **Remove User from Org**    | `DELETE /users/:userId/membership`     | Removes a user from the organization. `ADMIN` role required. Cannot remove self or higher/equal role.      | (None)                                                                            | `{ message: "User removed." }` (204 No Content)                                 |
| **Get All Teams**           | `GET /teams`                | Retrieves all teams in the organization.                                                                  | (None)                                                                            | `Team[]`                                                                        |
| **Create Team**             | `POST /teams`               | Creates a new team. `ADMIN` role required.                                                                | `{ name: string, leadIds: string[], memberIds: string[] }`                        | `Team` (the new team) (201 Created)                                             |
| **Update Team**             | `PUT /teams/:teamId`        | Updates a team's name, leads, or members. `ADMIN` role required.                                          | `{ name?: string, leadIds?: string[], memberIds?: string[] }`                      | `Team` (the updated team)                                                       |
| **Delete Team**             | `DELETE /teams/:teamId`     | Deletes a team. `ADMIN` role required.                                                                    | (None)                                                                            | `{ message: "Team deleted." }` (204 No Content)                                 |

### 3.5 Finance (`/api/finance`)

*Requires `ADMIN` or `SUPER_ADMIN` role, Authentication and `X-Organization-Id` header.*

| Action                      | Method & Path               | Description                                                                                             | Request Body                                                              | Success Response                                      |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Get Finance Summary**     | `GET /finance/summary`      | Retrieves totals for income, expenses, and balance. Can be filtered by `projectId`.                     | (Query Params: `?projectId=all` or `?projectId=<id>`)                     | `FinanceSummary`                                      |
| **Get Finance Entries**     | `GET /finance/entries`      | Retrieves a list of all financial entries, sorted by date. Can be filtered by `projectId`.              | (Query Params: `?projectId=all` or `?projectId=<id>`)                     | `FinanceEntry[]`                                      |
| **Create Finance Entry**    | `POST /finance/entries`     | Adds a new income or expense entry.                                                                     | `{ type: 'INCOME' | 'EXPENSE', amount: number, description: string, date: string, projectId?: string, taskId?: string }` | `FinanceEntry` (the new entry) (201 Created)          |

### 3.6 Chat (`/api/conversations`)

*Requires Authentication and `X-Organization-Id` header.*

| Action                      | Method & Path          | Description                                                                                   | Request Body                                                                               | Success Response                                                     |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Get All Conversations**   | `GET /conversations`   | Retrieves a list of all conversations (private and group) for the authenticated user.           | (None)                                                                                     | `Conversation[]`                                                     |
| **Create Conversation**     | `POST /conversations`  | Creates a new private or group conversation.                                                  | `{ type: 'private' | 'group', participantIds: string[], name?: string, avatarUrl?: string }` | `Conversation` (the new conversation) (201 Created)                |
| **Get Messages for Convo**  | `GET /conversations/:conversationId/messages` | Fetches all messages for a specific conversation. Supports pagination. `?page=1&limit=50` | (None)                                                                                     | `{ messages: Message[], totalPages: number, currentPage: number }`   |

---

## 4. Real-time Communication (WebSockets)

The client will establish a WebSocket connection after login for real-time chat and notifications.

### Client Emits (Sends to Server)

-   `send_message`
    -   **Description**: Sent when a user sends a new chat message.
    -   **Payload**:
        ```ts
        {
          conversationId: string;
          text: string;
        }
        ```

### Client Listens (Receives from Server)

-   `new_message`
    -   **Description**: Received when a new message is posted in any of the user's conversations.
    -   **Payload**: A `Message` object, extended with the `conversationId`.
        ```ts
        {
          id: string;
          senderId: string;
          text: string;
          timestamp: string; // ISO String
          conversationId: string;
        }
        ```

-   `new_notification`
    -   **Description**: Received when a new notification is generated for the user.
    -   **Payload**: A `Notification` object.
        ```ts
        {
          id: string;
          type: 'comment' | 'assignment' | 'status_change' | 'deadline';
          text: string;
          timestamp: string; // ISO String
          read: boolean;
        }
        ```
---

## 5. Data Models

The frontend expects the API to return data matching these TypeScript interfaces.

```typescript
export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  profilePictureUrl?: string;
  jobTitle?: string;
}

export interface Organization {
  id:string;
  name: string;
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';
  organization?: Organization; // Populated by server
  user?: User; // Populated by server
}

export interface Comment {
    id: string;
    author: User; // Should be the full User object or at least id, fullName, avatar
    content: string;
    timestamp: string; // ISO String
}

export type TaskStatus = 'מתוכנן' | 'בתהליך' | 'תקוע' | 'הושלם';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneesIds: string[]; // IDs of users
  assignees?: User[]; // Optional: server can populate this for convenience
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  expense?: number;
  status: TaskStatus;
  subtasks: Task[];
  color: string;
  comments: Comment[];
}

export type ProjectStatus = 'מתוכנן' | 'בתהליך' | 'לקראת סיום' | 'בסיכון' | 'מוקפא' | 'הושלם';

export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  budget?: number;
  status: ProjectStatus;
  teamIds: string[];
  team?: Team[]; // Optional: server can populate this
  tasks: Task[];
  isArchived: boolean;
  teamLeads: User[];
}

export type FinanceEntryType = 'INCOME' | 'EXPENSE';

export interface FinanceEntry {
  id: string;
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

export interface Team {
  id: string;
  name: string;
  leadIds: string[];
  memberIds: string[];
}

export interface Message {
  id: string;
  senderId: string;
  sender?: User; // Optional: server can populate this
  text: string;
  timestamp: string; // ISO String
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  participantIds: string[];
  participants?: User[]; // Optional: server can populate this
  name?: string; // For group chats
  avatarUrl?: string; // For group chats
  messages: Message[];
  unreadCount?: number;
}

export interface Notification {
  id: string;
  type: 'comment' | 'assignment' | 'status_change' | 'deadline';
  text: string;
  timestamp: string; // ISO String
  read: boolean;
  link?: string; // Optional: a URL to navigate to on click
}
```

---

## 6. Getting Started (For Frontend Devs Testing the Server)

To ensure the client-side developers can run and test against the server locally, please provide the following:

1.  **Prerequisites**: A list of required software (e.g., Node.js v18+, Docker, PostgreSQL v14+).
2.  **Installation**: Clear instructions on how to install dependencies.
    ```bash
    npm install
    ```
3.  **Environment Configuration**: Provide a `.env.example` file that developers can copy to `.env` and fill in with their local database credentials, JWT secret, etc.
4.  **Running the Server**: A single command to start the server in development mode with hot-reloading.
    ```bash
    npm run dev
    ```
5.  **Database Seeding**: An optional script to populate the database with dummy data for easier testing.
    ```bash
    npm run seed
    ```