import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly _supabaseService: SupabaseService,
  ) {}

  private getAuthClient() {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!url || !anonKey) {
      throw new UnauthorizedException('Auth provider is not configured');
    }

    return createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private hasAdminAccess(email: string, appRole?: string) {
    if (appRole === 'admin') {
      return true;
    }

    const configuredAdmins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (configuredAdmins.length === 0) {
      return true;
    }

    return configuredAdmins.includes(email.toLowerCase());
  }

  async validateUser(email: string, password: string) {
    try {
      this.logger.log(`Validating user: ${email}`);

      const authClient = this.getAuthClient();
      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        this.logger.warn(`Invalid credentials for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const role =
        (data.user.app_metadata?.role as string | undefined) ||
        (data.user.user_metadata?.role as string | undefined);

      if (!this.hasAdminAccess(data.user.email || email, role)) {
        this.logger.warn(`User without admin access tried login: ${email}`);
        throw new UnauthorizedException('Admin access required');
      }

      return {
        id: data.user.id,
        email: data.user.email || email,
        role: role || 'admin',
      };
    } catch (error) {
      this.logger.error('Error validating user', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      email: user.email,
      sub: user.id,
      role: user.role,
    });

    return {
      access_token: token,
      user,
    };
  }

  async verify(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
