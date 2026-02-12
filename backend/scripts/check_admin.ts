
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for admin users...');
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
    });

    if (admins.length === 0) {
        console.log('❌ No ADMIN user found in the database.');

        // Create one
        console.log('Creating default admin...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const newAdmin = await prisma.user.create({
            data: {
                email: 'admin@school.com',
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                role: 'ADMIN',
            },
        });
        console.log(`✅ Created admin: ${newAdmin.email} / password123`);
    } else {
        console.log(`✅ Found ${admins.length} admin(s):`);
        for (const admin of admins) {
            console.log(`- ${admin.email} (ID: ${admin.id})`);
            // Optional: Test password if it matches 'password123'
            const isMatch = await bcrypt.compare('password123', admin.password);
            console.log(`  Password 'password123' match: ${isMatch}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
