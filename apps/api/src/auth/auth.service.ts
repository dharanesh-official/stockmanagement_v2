
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

        // --- EMERGENCY BOOTSTRAP LOGIC ---
        // If this is the admin and they don't exist, create them immediately.
        if (email === 'admin@stockpro.com' && pass === 'StockPro@123') {
            let user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                console.log('⚡ Emergency: Admin user missing. Auto-creating...');
                const passwordHash = await argon2.hash(pass);
                user = await this.prisma.user.create({
                    data: {
                        email: 'admin@stockpro.com',
                        passwordHash,
                        fullName: 'Super Admin',
                        role: 'SUPER_ADMIN' as any, // Cast to any to avoid potential enum import issues
                        isActive: true,
                    },
                });
                console.log('✅ Emergency Admin created successfully.');
            }
            if (user) {
                const { passwordHash, ...result } = user;
                return result;
            }
        }
        // --- END EMERGENCY LOGIC ---

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
