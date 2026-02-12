import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB CHECK ---');
    const user = await prisma.user.findUnique({
        where: { email: 'admin@school.com' }
    });

    if (user) {
        console.log('Admin User: FOUND');
        console.log('Email:', user.email);
        console.log('Role:', user.role);

        const isMatch = await bcrypt.compare('12345678', user.password);
        console.log('Password "12345678" Match:', isMatch);
    } else {
        console.log('Admin User: NOT FOUND');
        const count = await prisma.user.count();
        console.log('Total User Count:', count);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
