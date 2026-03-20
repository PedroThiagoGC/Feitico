/**
 * SuperAdmin API Client
 * Extends base API with platform-level operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string;
  timestamp: string;
}

class SuperAdminApiClient {
  private baseURL: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseURL = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('superadminToken');
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
    if (!result.success) throw new Error(result.message || 'API request failed');
    return result.data as T;
  }

  private buildQuery(params: Record<string, string | number | boolean | undefined>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
    const q = sp.toString();
    return q ? `?${q}` : '';
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>('POST', '/auth/login', { email, password });
  }

  async verifyToken(token: string) {
    return this.request<any>('POST', '/auth/verify', { token });
  }

  // Tenants (uses existing salons + tenants tables)
  async getTenants() {
    return this.request<any[]>('GET', '/salons');
  }

  async getTenant(id: string) {
    return this.request<any>('GET', `/salons/${id}`);
  }

  async createTenant(data: any) {
    return this.request<any>('POST', '/salons', data);
  }

  async updateTenant(id: string, data: any) {
    return this.request<any>('PUT', `/salons/${id}`, data);
  }

  // Platform stats - aggregated from existing endpoints
  async getPlatformStats() {
    const tenants = await this.getTenants();
    const activeTenants = tenants.filter((t: any) => t.active !== false);

    let totalProfessionals = 0;
    let totalBookings = 0;
    let totalRevenue = 0;

    // Aggregate stats from each tenant
    for (const tenant of activeTenants.slice(0, 20)) {
      try {
        const [pros, bookings] = await Promise.all([
          this.request<any[]>('GET', `/professionals?salonId=${tenant.id}`).catch(() => []),
          this.request<any[]>('GET', `/bookings?salonId=${tenant.id}`).catch(() => []),
        ]);
        totalProfessionals += (pros || []).length;
        totalBookings += (bookings || []).length;
        totalRevenue += (bookings || []).reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);
      } catch {
        // Skip tenant on error
      }
    }

    return {
      totalTenants: tenants.length,
      activeTenants: activeTenants.length,
      suspendedTenants: tenants.length - activeTenants.length,
      totalProfessionals,
      totalBookings,
      totalRevenue,
    };
  }

  // Bookings across tenants
  async getAllBookings(filters?: { salonId?: string; status?: string }) {
    const query = this.buildQuery(filters || {});
    return this.request<any[]>('GET', `/bookings${query}`);
  }

  // Professionals across tenants
  async getAllProfessionals(salonId?: string) {
    const query = this.buildQuery({ salonId });
    return this.request<any[]>('GET', `/professionals${query}`);
  }

  // Services across tenants
  async getAllServices(salonId?: string) {
    const query = this.buildQuery({ salonId });
    return this.request<any[]>('GET', `/services${query}`);
  }
}

export const superadminApi = new SuperAdminApiClient();
