/**
 * API Client - Centralized HTTP requests to backend
 * Replaces direct Supabase calls for data operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string;
  timestamp: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseURL = baseUrl;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Bookings
  async getBookings(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>('GET', `/bookings${query}`);
  }

  async getBooking(id: string) {
    return this.request<any>('GET', `/bookings/${id}`);
  }

  async createBooking(data: any) {
    return this.request<any>('POST', '/bookings', data);
  }

  async updateBooking(id: string, data: any) {
    return this.request<any>('PUT', `/bookings/${id}`, data);
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request<any>('PUT', `/bookings/${id}/status`, { status });
  }

  async deleteBooking(id: string) {
    return this.request<any>('DELETE', `/bookings/${id}`);
  }

  async getBookingStats() {
    return this.request<any>('GET', '/bookings/stats');
  }

  // Professionals
  async getProfessionals() {
    return this.request<any[]>('GET', '/professionals');
  }

  async getProfessional(id: string) {
    return this.request<any>('GET', `/professionals/${id}`);
  }

  async createProfessional(data: any) {
    return this.request<any>('POST', '/professionals', data);
  }

  async updateProfessional(id: string, data: any) {
    return this.request<any>('PUT', `/professionals/${id}`, data);
  }

  async deleteProfessional(id: string) {
    return this.request<any>('DELETE', `/professionals/${id}`);
  }

  // Services
  async getServices() {
    return this.request<any[]>('GET', '/services');
  }

  async getService(id: string) {
    return this.request<any>('GET', `/services/${id}`);
  }

  async createService(data: any) {
    return this.request<any>('POST', '/services', data);
  }

  async updateService(id: string, data: any) {
    return this.request<any>('PUT', `/services/${id}`, data);
  }

  async deleteService(id: string) {
    return this.request<any>('DELETE', `/services/${id}`);
  }

  // Gallery
  async getGallery(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<any[]>('GET', `/gallery${query}`);
  }

  async getGalleryImage(id: string) {
    return this.request<any>('GET', `/gallery/${id}`);
  }

  async createGalleryImage(data: any) {
    return this.request<any>('POST', '/gallery', data);
  }

  async updateGalleryImage(id: string, data: any) {
    return this.request<any>('PUT', `/gallery/${id}`, data);
  }

  async deleteGalleryImage(id: string) {
    return this.request<any>('DELETE', `/gallery/${id}`);
  }

  // Testimonials
  async getTestimonials(minRating?: number) {
    const query = minRating ? `?minRating=${minRating}` : '';
    return this.request<any[]>('GET', `/testimonials${query}`);
  }

  async getTestimonial(id: string) {
    return this.request<any>('GET', `/testimonials/${id}`);
  }

  async createTestimonial(data: any) {
    return this.request<any>('POST', '/testimonials', data);
  }

  async updateTestimonial(id: string, data: any) {
    return this.request<any>('PUT', `/testimonials/${id}`, data);
  }

  async deleteTestimonial(id: string) {
    return this.request<any>('DELETE', `/testimonials/${id}`);
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>('POST', '/auth/login', {
      email,
      password,
    });
  }

  async verifyToken(token: string) {
    return this.request<any>('POST', '/auth/verify', { token });
  }

  // Health check
  async health() {
    try {
      return await fetch(`${this.baseURL.replace('/api/v1', '')}/health`).then((r) => r.json());
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }
}

export const api = new ApiClient();
