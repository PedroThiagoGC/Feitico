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

type BookingQuery = {
  salonId?: string;
  professionalId?: string;
  date?: string;
  status?: string;
  statuses?: string[];
};

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

  private buildQuery(params: Record<string, string | number | boolean | string[] | undefined>) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          searchParams.set(key, value.join(','));
        }
        return;
      }

      searchParams.set(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  async getSalon(id?: string) {
    return this.request<any>('GET', id ? `/salons/${id}` : '/salons/current');
  }

  async createSalon(data: any) {
    return this.request<any>('POST', '/salons', data);
  }

  async updateSalon(id: string, data: any) {
    return this.request<any>('PUT', `/salons/${id}`, data);
  }

  // Bookings
  async getBookings(filters?: string | BookingQuery) {
    const normalizedFilters =
      typeof filters === 'string' ? { status: filters } : (filters ?? {});
    const query = this.buildQuery(normalizedFilters);
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
  async getProfessionals(salonId?: string) {
    const query = this.buildQuery({ salonId });
    return this.request<any[]>('GET', `/professionals${query}`);
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

  async getProfessionalServices(professionalId: string) {
    return this.request<any[]>('GET', `/professionals/${professionalId}/services`);
  }

  async getProfessionalAvailability(professionalId: string) {
    return this.request<any[]>('GET', `/professionals/${professionalId}/availability`);
  }

  async createProfessionalAvailability(professionalId: string, data: any) {
    return this.request<any>('POST', `/professionals/${professionalId}/availability`, data);
  }

  async updateProfessionalAvailability(availabilityId: string, data: any) {
    return this.request<any>('PUT', `/professionals/availability/${availabilityId}`, data);
  }

  async deleteProfessionalAvailability(availabilityId: string) {
    return this.request<any>('DELETE', `/professionals/availability/${availabilityId}`);
  }

  async getProfessionalExceptions(professionalId: string, month?: string) {
    const query = this.buildQuery({ month });
    return this.request<any[]>(
      'GET',
      `/professionals/${professionalId}/exceptions${query}`,
    );
  }

  async createProfessionalException(professionalId: string, data: any) {
    return this.request<any>('POST', `/professionals/${professionalId}/exceptions`, data);
  }

  async updateProfessionalException(exceptionId: string, data: any) {
    return this.request<any>('PUT', `/professionals/exceptions/${exceptionId}`, data);
  }

  async deleteProfessionalException(exceptionId: string) {
    return this.request<any>('DELETE', `/professionals/exceptions/${exceptionId}`);
  }

  async getProfessionalServiceLinks(serviceIds: string[]) {
    const query = this.buildQuery({ serviceIds });
    return this.request<any[]>(`GET`, `/professionals/service-links${query}`);
  }

  async createProfessionalServiceLink(professionalId: string, data: any) {
    return this.request<any>('POST', `/professionals/${professionalId}/services`, data);
  }

  async updateProfessionalServiceLink(linkId: string, data: any) {
    return this.request<any>('PUT', `/professionals/service-links/${linkId}`, data);
  }

  async deleteProfessionalServiceLink(linkId: string) {
    return this.request<any>('DELETE', `/professionals/service-links/${linkId}`);
  }

  // Services
  async getServices(salonId?: string) {
    const query = this.buildQuery({ salonId });
    return this.request<any[]>('GET', `/services${query}`);
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
  async getGallery(salonId?: string) {
    const query = this.buildQuery({ salonId });
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
  async getTestimonials(filters?: { salonId?: string; minRating?: number }) {
    const query = this.buildQuery(filters ?? {});
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

  async uploadImage(data: {
    folder?: string;
    fileName?: string;
    mimeType?: string;
    dataBase64: string;
  }) {
    return this.request<{ url: string; path: string }>('POST', '/uploads/image', data);
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
