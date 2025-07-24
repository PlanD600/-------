# ProjectFlow - Backend API Specification (V2 - Enhanced)

## 1. Introduction

This document provides a refined technical specification for the ProjectFlow backend REST API. It builds upon the initial version by adding explicit details regarding **permissions, standardization, error handling, and data models**. It is written from the frontend's perspective to serve as a precise contract for backend development.

### Target Audience

This specification is for **backend developers**. It defines the exact requirements the server must fulfill to support the client application.

### General Principles

-   **Format**: All API communication is via a RESTful interface using JSON.
-   **Authentication**: All requests (except `/auth/**`) must be authenticated with a `Bearer` token (JWT) in the `Authorization` header.
-   **Organization Context**: All requests within an organization's context must include an `X-Organization-Id` header.
-   **Timestamps**: All major data models (`Project`, `Task`, `User`, etc.) should include `createdAt` and `updatedAt` ISO string timestamps, managed by the server.

---

## 2. Standardization Rules

To ensure consistency, all endpoints returning a list of items must adhere to the following rules.

### Pagination

-   **Mechanism**: All `GET` endpoints that return an array (e.g., `GET /projects`, `GET /users`) must support pagination via query parameters.
-   **Parameters**:
    -   `?page=<number>` (default: `1`)
    -   `?limit=<number>` (default: `25`)
-   **Response structure**: The response for a paginated resource must be an object containing the data and pagination metadata.
    ```json
    {
      "data": [ ...items... ],
      "totalItems": 150,
      "totalPages": 6,
      "currentPage": 1
    }
    ```

### Sorting

-   **Mechanism**: All `GET` endpoints that return an array should support sorting.
-   **Parameters**:
    -   `?sortBy=<field_name>` (e.g., `createdAt`, `title`)
    -   `?sortOrder=<asc|desc>` (default: `desc`)

---

## 3. Error Handling

The server must return standardized error responses.

| Status Code | Meaning                  | Description                                                                                                  | Example Response Body                                                              |
| :---------- | :----------------------- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `400`       | **Bad Request**          | General client-side error, like malformed JSON.                                                              | `{ "message": "Malformed request body." }`                                         |
| `401`       | **Unauthorized**         | The JWT is missing, invalid, or expired. The client should redirect to the login page.                       | `{ "message": "Authentication token is required." }`                               |
| `403`       | **Forbidden**            | The user is authenticated but lacks the necessary permissions to perform the action.                         | `{ "message": "You do not have permission to perform this action." }`              |
| `404`       | **Not Found**            | The requested resource (e.g., a specific project or user) could not be found.                                | `{ "message": "Project with ID '123' not found." }`                                |
| `422`       | **Unprocessable Entity** | The request was well-formed but contained semantic errors (validation failed). Used for form submissions.      | `{ "message": "Validation failed.", "errors": [{ "field": "phone", "message": "Phone number is invalid." }] }` |

---

## 4. API Endpoint Specification

### 4.1 Authentication (`/api/auth`)

| Action                 | Method & Path           | Permissions | Request Body                                              | Success Response (200 OK)                                  |
| ---------------------- | ----------------------- | :---------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
| **Register**           | `POST /auth/register`   | Public      | `{ fullName, phone, organizationName }`                   | `{ message: "Registration successful." }`                  |
| **Send OTP**           | `POST /auth/otp/send`   | Public      | `{ phone }`                                               | `{ message: "OTP sent." }`                                 |
| **Verify OTP**         | `POST /auth/otp/verify` | Public      | `{ phone, otpCode }`                                      | `{ token, user: User, memberships: Membership[] }`         |
| **Get My Memberships** | `GET /auth/me/memberships`| Authenticated | (None)                                                    | `Membership[]`                                             |
| **Get My Profile**     | `GET /auth/me`          | Authenticated | (None)                                                    | `User`                                                     |
| **Update My Profile**  | `PUT /auth/me`          | Authenticated | `{ fullName?, jobTitle?, email?, profilePictureUrl? }`    | `User` (updated)                                           |

### 4.2 Projects (`/api/projects`)

*Requires Authentication and `X-Organization-Id` header.*

| Action                        | Method & Path             | Permissions (`*` = Project-specific)                | Request Body                                                              | Success Response (200 OK)             |
| ----------------------------- | ------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------ |
| **Get All Projects**          | `GET /projects`           | `EMPLOYEE` and up                                   | (Supports Pagination & Sorting)                                           | Paginated `Project[]`                 |
| **Create Project**            | `POST /projects`          | `ADMIN`, `SUPER_ADMIN`                              | `{ title, description?, teamLeads, startDate?, endDate?, budget? }`       | `Project` (201 Created)               |
| **Update Project**            | `PUT /projects/:projectId`| `ADMIN`, `SUPER_ADMIN`, `TEAM_LEADER`*              | `{ title?, description?, teamLeads?, startDate?, endDate?, budget? }`     | `Project` (updated)                   |
| **Archive Project**           | `PATCH /projects/:projectId` | `ADMIN`, `SUPER_ADMIN`, `TEAM_LEADER`*              | `{ isArchived: boolean }`                                                 | `Project` (updated)                   |
| **Delete Project**            | `DELETE /projects/:projectId`| `ADMIN`, `SUPER_ADMIN`                              | (None)                                                                    | (204 No Content)                      |

### 4.3 Tasks (`/api/projects/:projectId/tasks`)

*Requires Authentication and `X-Organization-Id` header.*

| Action                  | Method & Path                       | Permissions (`*` = Project-specific)                | Request Body                                                | Success Response (200 OK)             |
| ----------------------- | ----------------------------------- | :-------------------------------------------------- | :---------------------------------------------------------- | :------------------------------------ |
| **Get Project Tasks**   | `GET /projects/:projectId/tasks`    | `EMPLOYEE` and up                                   | (Supports Pagination & Sorting)                             | Paginated `Task[]`                    |
| **Create Task**         | `POST /projects/:projectId/tasks`   | `ADMIN`, `SUPER_ADMIN`, `TEAM_LEADER`*              | `{ title, description?, assigneesIds?, ... }`               | `Task` (201 Created)                  |
| **Update Task**         | `PUT /projects/:projectId/tasks/:taskId` | **Assignees**: Can update `status`. <br> **`TEAM_LEADER`***: Can update all fields. <br> **`ADMIN`+**: Can update all fields. | `{ title?, description?, status?, ... }`                    | `Task` (updated)                      |
| **Delete Task**         | `DELETE /projects/:projectId/tasks/:taskId` | `ADMIN`, `SUPER_ADMIN`, `TEAM_LEADER`*              | (None)                                                      | (204 No Content)                      |
| **Add Comment**         | `POST /projects/:projectId/tasks/:taskId/comments` | `EMPLOYEE` and up                                   | `{ content: string }`                                       | `Comment` (201 Created)               |

### 4.4 Users & Teams (`/api/`)

*Requires Authentication and `X-Organization-Id` header. Most actions are restricted.*

| Action                      | Method & Path        | Permissions                                      | Request Body                                         | Success Response (200 OK)             |
| --------------------------- | -------------------- | :----------------------------------------------- | :--------------------------------------------------- | :------------------------------------ |
| **Get All Users in Org**    | `GET /users`         | `ADMIN`, `SUPER_ADMIN`                           | (Supports Pagination & Sorting)                      | Paginated `Membership[]`              |
| **Invite User**             | `POST /users/invite` | `ADMIN`, `SUPER_ADMIN`                           | `{ fullName, phone, jobTitle, role }`                | `User` (201 Created)                  |
| **Update User Role**        | `PUT /users/:userId/membership` | `ADMIN`, `SUPER_ADMIN` (can't edit higher role)  | `{ role: Membership['role'] }`                       | `Membership` (updated)                |
| **Remove User from Org**    | `DELETE /users/:userId/membership` | `ADMIN`, `SUPER_ADMIN` (can't remove higher role)| (None)                                               | (204 No Content)                      |
| **Get All Teams**           | `GET /teams`         | `ADMIN`, `SUPER_ADMIN`                           | (Supports Pagination & Sorting)                      | Paginated `Team[]`                    |
| **Create Team**             | `POST /teams`        | `ADMIN`, `SUPER_ADMIN`                           | `{ name, leadIds, memberIds }`                       | `Team` (201 Created)                  |
| **Update Team**             | `PUT /teams/:teamId` | `ADMIN`, `SUPER_ADMIN`                           | `{ name?, leadIds?, memberIds? }`                    | `Team` (updated)                      |
| **Delete Team**             | `DELETE /teams/:teamId` | `ADMIN`, `SUPER_ADMIN`                           | (None)                                               | (204 No Content)                      |

---

## 5. Real-time Communication (WebSockets)

*The specification for WebSockets remains the same as V1.*

---

## 6. Enriched Data Models

This section provides a more detailed structure for the data models, including populated fields and timestamps. **Bold** fields are required.

```typescript
// Base interface for all major models
interface BaseModel {
  id: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
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

// Defines a user's role within a specific organization
// This is the primary object for user management within an org context.
export interface Membership {
  userId: string;
  organizationId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEADER' | 'EMPLOYEE';
  // Below fields must be populated by the server in responses
  organization: Organization;
  user: User; 
}

export interface Comment extends BaseModel {
  author: User; // Populated User object
  content: string;
}

export type TaskStatus = 'מתוכנן' | 'בתהליך' | 'תקוע' | 'הושלם';

export interface Task extends BaseModel {
  title: string;
  description?: string;
  assignees: User[]; // Populated array of User objects
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: TaskStatus;
  color: string;
  comments: Comment[]; // Populated array of Comment objects
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
  tasks: Task[]; // Populated array of Task objects
}

export interface Team extends BaseModel {
  name: string;
  leadIds: string[]; // Stored as IDs
  memberIds: string[]; // Stored as IDs
  // When returned from API, can be populated:
  leads?: User[];
  members?: User[];
}

export interface Message extends BaseModel {
  sender: User; // Populated User object
  text: string;
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
  link: string; // A relative path for the client, e.g., "/projects/1/tasks/2"
}
```

---

## 7. Getting Started (For Frontend Devs Testing the Server)

*The specification for Getting Started remains the same as V1.*