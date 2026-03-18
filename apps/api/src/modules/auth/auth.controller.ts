import {
  Controller,
  Post,
  Body,
  HttpCode,
  Version,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() credentials: { email: string; password: string }) {
    if (!credentials.email || !credentials.password) {
      throw new UnauthorizedException('Email and password are required');
    }
    return this.authService.login(credentials.email, credentials.password);
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: { token: string }) {
    if (!body.token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.authService.verify(body.token);
  }
}
