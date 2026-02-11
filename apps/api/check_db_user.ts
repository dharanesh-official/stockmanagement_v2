import { PrismaClient } from '@prisma/client';

async function checkUser() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@stockpro.com' },
        });
        if (user) {
            console.log('✅ Found user:', user.email, 'Role:', user.role);
        } else {
            console.log('❌ User admin@stockpro.com NOT found in database.');
        }
    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
