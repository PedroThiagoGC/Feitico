import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async validateUser(email: string, password: string) {
    try {
      // Implement your auth logic here
      // This is a placeholder - in production, validate against database
      this.logger.log(`Validating user: ${email}`);

      // For now, we'll just return user info
      // In production, query your auth system
      return { email, id: 'user-id' };
    } catch (error) {
      this.logger.error('Error validating user', error);
      throw new UnauthorizedException('Invalid credentials');
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
