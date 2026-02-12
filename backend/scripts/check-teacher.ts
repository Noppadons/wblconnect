import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const teacher = await prisma.teacher.findUnique({
        where: { id: '30e24c69-979e-407b-9549-0d8b4eb1060d' },
        include: { user: true }
    });
    console.log('Teacher Info:', JSON.stringify(teacher, null, 2));

    const allTeachers = await prisma.teacher.findMany({ include: { user: true } });
    console.log('All Teachers:', JSON.stringify(allTeachers, null, 2));
}

main().finally(() => prisma.$disconnect());
