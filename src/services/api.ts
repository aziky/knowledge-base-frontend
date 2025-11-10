import axios from 'axios';
import type { ApiResponse, Project, ProjectListResponse, ProjectDetails, User, ProjectInvitationResponse, InvitationUser, Member } from '@/types';

// Chat API functions (chat-service)
const chatServiceClient = axios.create({
  baseURL: 'http://localhost:7075/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes timeout for chat API
});

export const chatApi = {
  ask: async (payload: { project_id?: string; document_ids: string[]; video_ids: string[]; question: string; conversation_id?: string | null }) => {
    try {
      // If document_ids or video_ids is not empty, remove project_id from payload
      const sendPayload = { ...payload };
      if ((sendPayload.document_ids && sendPayload.document_ids.length > 0) ||
        (sendPayload.video_ids && sendPayload.video_ids.length > 0)) {
        delete sendPayload.project_id;
      }
      console.log('Chat ask payload:', JSON.stringify(sendPayload));
      const response = await chatServiceClient.post('/chat', sendPayload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to get response from chat service',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },

  getConversations: async () => {
    try {
      const response = await chatServiceClient.get(`/chat`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to get conversations',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },

  getConversationMessages: async (conversationId: string) => {
    try {
      const response = await chatServiceClient.get(`/chat/${conversationId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to get conversation messages',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },
};

const API_BASE_URL = 'http://localhost:7070';

// Create base axios instance
const createApiClient = (servicePath: string) => {
  return axios.create({
    baseURL: `${API_BASE_URL}/${servicePath}`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
  });
};

// Service-specific clients
const userServiceClient = createApiClient('user-service/api');
const projectServiceClient = createApiClient('project-service/api');
const notificationServiceClient = createApiClient('notification-service/api');

// API Response helper functions (similar to Java static methods)
export class ApiResponseHelper {
  static success<T>(data: T, message = "Success"): ApiResponse<T> {
    return {
      code: 200,
      message,
      data
    };
  }

  static successMessage(message: string): ApiResponse<null> {
    return {
      code: 200,
      message,
      data: null
    };
  }

  static created<T>(data: T, message = "Created successfully"): ApiResponse<T> {
    return {
      code: 201,
      message,
      data
    };
  }

  static createdMessage(message: string): ApiResponse<null> {
    return {
      code: 201,
      message,
      data: null
    };
  }

  static badRequest(message: string): ApiResponse<null> {
    return {
      code: 400,
      message,
      data: null
    };
  }

  static unauthorized(message: string): ApiResponse<null> {
    return {
      code: 401,
      message,
      data: null
    };
  }

  static notFound(message: string): ApiResponse<null> {
    return {
      code: 404,
      message,
      data: null
    };
  }

  static internalError(message = "Internal server error"): ApiResponse<null> {
    return {
      code: 500,
      message,
      data: null
    };
  }
}

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  fullName: string;
  email: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Project members API
export const memberApi = {
  addMember: async (projectId: string, email: string): Promise<ApiResponse<Member>> => {
    try {
      const response = await projectServiceClient.post(`/projects/${projectId}/members`, { email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to add member to project',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },

  removeMembers: async (projectId: string, memberIds: string[]): Promise<ApiResponse<void>> => {
    try {
      const response = await projectServiceClient.delete(`/project/${projectId}/members`, {
        data: { memberIds }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to remove member from project',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },

  getMembers: async (projectId: string): Promise<ApiResponse<Member[]>> => {
    try {
      const response = await projectServiceClient.get(`/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to get project members',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },


  searchUsers: async (searchTerm: string): Promise<ApiResponse<User[]>> => {
    try {
      const response = await userServiceClient.get(`/user/search`, {
        params: { query: searchTerm }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to get project members',
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: 'Network error occurred' } as ApiError;
    }
  },
};

// Types for projects
export interface CreateProjectRequest {
  name: string;
  description?: string;
}
// Authentication API functions (user-service)
export const authApi = {
  // Login function
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await userServiceClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      const apiResponse = response.data;

      // Check if the API response indicates success
      if (apiResponse.code === 200 && apiResponse.data) {
        return apiResponse.data;
      } else {
        throw {
          message: apiResponse.message || 'Login failed',
          status: apiResponse.code,
        } as ApiError;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiResponse = error.response?.data as ApiResponse<null>;
        throw {
          message: apiResponse?.message || error.response?.data?.message || 'Login failed',
          status: error.response?.status || apiResponse?.code,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Logout function (if needed)
  logout: async (): Promise<void> => {
    try {
      await userServiceClient.post('/auth/logout');
    } catch {
      console.error('Logout error');
    }
  },

  // Verify token function (for checking if user is still authenticated)
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      const response = await userServiceClient.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

// Project API functions (project-service)
export const projectApi = {
  // Delete files from project
  deleteFilesFromProject: async (
    projectId: string,
    files: { id: string; fileType: string }[]
  ) => {
    try {
      console.log('Deleting files:', JSON.stringify(files));
      const response = await projectServiceClient.delete(`/project/${projectId}/files`, {
        data: files,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || "Failed to delete files",
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: "Network error occurred" } as ApiError;
    }
  },
  // Get all projects
  getProjects: async (): Promise<ProjectListResponse> => {
    try {
      const response = await projectServiceClient.get<ApiResponse<ProjectListResponse>>('/project');
      const apiResponse = response.data;

      // Check if the API response indicates success
      if (apiResponse.code === 200 && apiResponse.data) {
        return apiResponse.data;
      } else {
        throw {
          message: apiResponse.message || 'Failed to fetch projects',
          status: apiResponse.code,
        } as ApiError;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiResponse = error.response?.data as ApiResponse<null>;
        throw {
          message: apiResponse?.message || error.response?.data?.message || 'Failed to fetch projects',
          status: error.response?.status || apiResponse?.code,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Get project details with files
  getProjectDetails: async (projectId: string): Promise<ProjectDetails> => {
    try {
      const response = await projectServiceClient.get<ApiResponse<ProjectDetails>>(`/project/${projectId}`);
      const apiResponse = response.data;

      // Check if the API response indicates success
      if (apiResponse.code === 200 && apiResponse.data) {
        return apiResponse.data;
      } else {
        throw {
          message: apiResponse.message || 'Failed to fetch project details',
          status: apiResponse.code,
        } as ApiError;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiResponse = error.response?.data as ApiResponse<null>;
        throw {
          message: apiResponse?.message || error.response?.data?.message || 'Failed to fetch project details',
          status: error.response?.status || apiResponse?.code,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Create new project
  createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
    try {
      const response = await projectServiceClient.post<ApiResponse<Project>>('/project', projectData);
      const apiResponse = response.data;

      // Check if the API response indicates success
      if (apiResponse.code === 200 && apiResponse.data) {
        return apiResponse.data;
      } else {
        throw {
          message: apiResponse.message || 'Failed to fetch project details',
          status: apiResponse.code,
        } as ApiError;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to create project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Update project
  updateProject: async (projectId: string, projectData: Partial<CreateProjectRequest>): Promise<Project> => {
    try {
      const response = await projectServiceClient.put(`/project/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to update project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await projectServiceClient.delete(`/project/${projectId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to delete project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Activate project
  activateProject: async (projectId: string): Promise<void> => {
    try {

      await projectServiceClient.patch(`/project/${projectId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to reactivate project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Invite users to project
  inviteUsersToProject: async (projectId: string, invitationUsers: InvitationUser[]): Promise<ProjectInvitationResponse> => {
    try {
      const response = await projectServiceClient.post(`/project/${projectId}/invite`, invitationUsers);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to invite users to project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Remove members from project
  removeMembersFromProject: async (projectId: string, memberIds: string[]): Promise<void> => {
    try {
      const response = await projectServiceClient.delete(`/project/${projectId}/members`, {
        data: { memberIds },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'Failed to remove members from project',
          status: error.response?.status,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },

  // Add file to project
  addFilesToProject: async (
    projectId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ) => {
    try {
      let totalUploaded = 0;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("files", file);
        return projectServiceClient.post(`/project/${projectId}/upload`, formData, {
          timeout: 120000,
          headers: {
            "Content-Type": undefined,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.loaded && progressEvent.total) {
              // Calculate cumulative progress for all files
              totalUploaded += progressEvent.loaded;
              if (onProgress) {
                const percent = Math.min(100, Math.round((totalUploaded / totalSize) * 100));
                onProgress(percent);
              }
            }
          },
        });
      });
      const responses = await Promise.all(uploadPromises);
      if (onProgress) onProgress(100); // Ensure progress bar completes on response
      return responses.flatMap((r) => r.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || "Failed to add files to project",
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: "Network error occurred" } as ApiError;
    }
  },

  // Download file from project
  downloadFile: async (
    fileId: string,
    fileType: 'document' | 'video',
    fileName: string
  ) => {
    try {


      const response = await projectServiceClient.get(`/project/download/${fileId}?type=${fileType}`, {
        responseType: 'blob', // Important for file downloads
        timeout: 180000, // 3 minutes for large files
      });

      const presignedUrl = response.data.presignedUrl;
      const blob = new Blob([presignedUrl]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || "Failed to download file",
          status: error.response?.status,
        } as ApiError;
      }
      throw { message: "Network error occurred" } as ApiError;
    }
  },

};

// User API functions (user-service)
export const userApi = {
  // Search users by name or email
  searchUsers: async (searchTerm: string): Promise<User[]> => {
    try {
      console.log('Searching users with term:', searchTerm);

      const endpoint = searchTerm.trim()
        ? `/user?name=${encodeURIComponent(searchTerm)}`
        : `/user`;

      const response = await userServiceClient.get<ApiResponse<User[]>>(endpoint);
      const apiResponse = response.data;

      if (apiResponse.code === 200 && apiResponse.data) {
        return apiResponse.data;
      } else {
        throw {
          message: apiResponse.message || 'Failed to search users',
          status: apiResponse.code,
        } as ApiError;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiResponse = error.response?.data as ApiResponse<null>;
        throw {
          message: apiResponse?.message || error.response?.data?.message || 'Failed to search users',
          status: error.response?.status || apiResponse?.code,
        } as ApiError;
      }
      throw {
        message: 'Network error occurred',
      } as ApiError;
    }
  },
};

// Function to add auth interceptors to a client
const addAuthInterceptors = (client: ReturnType<typeof axios.create>) => {
  // Add request interceptor to include auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle token expiration
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, remove from storage
        localStorage.removeItem('authToken');
        // Optionally redirect to login page
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all service clients
addAuthInterceptors(userServiceClient);
addAuthInterceptors(projectServiceClient);
addAuthInterceptors(notificationServiceClient);
addAuthInterceptors(chatServiceClient);

// Export individual clients if needed
export { userServiceClient, projectServiceClient, notificationServiceClient };