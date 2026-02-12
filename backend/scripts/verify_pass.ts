
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@school.com' }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    const isMatch = await bcrypt.compare('123456', user.password);
    console.log(`Email: ${user.email}`);
    console.log(`Stored Hash: ${user.password}`);
    console.log(`Match with '123456': ${isMatch}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
