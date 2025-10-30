import axios from 'axios';
import type { ApiResponse, Project, ProjectListResponse, ProjectDetails, User, ProjectInvitationResponse, InvitationUser } from '@/types';

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

// Export individual clients if needed
export { userServiceClient, projectServiceClient, notificationServiceClient };