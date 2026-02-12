import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(`[AuthService] Validating user: ${email}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log(`[AuthService] User NOT found: ${email}`);
      return null;
    }

    console.log(`[AuthService] User found. Stored password prefix: ${user.password.substring(0, 7)}... Length: ${user.password.length}`);
    console.log(`[AuthService] Incoming password length: ${pass?.length}`);

    const isMatch = await bcrypt.compare(pass, user.password);
    console.log(`[AuthService] Comparison result: ${isMatch}`);

    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
