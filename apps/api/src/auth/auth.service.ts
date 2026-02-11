
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { AuthPayloadDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`🔐 Login attempt for: ${email}`);
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return null;
        }

        // SECURITY: Argon2 Verify
        const isMatch = await argon2.verify(user.passwordHash, pass);
        if (isMatch) {
            console.log(`✅ Login successful for: ${email}`);
            const { passwordHash, ...result } = user;
            return result;
        }

        console.log(`❌ Password mismatch for: ${email}`);
        return null;
    }

    async login(payload: AuthPayloadDto) {
        const user = await this.validateUser(payload.email, payload.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // SECURITY: Generate Short-lived JWT
        const tokenPayload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(tokenPayload),
            user: {
                id: user.id,
                name: user.fullName,
                role: user.role
            }
        };
    }
}
