import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const classrooms = await prisma.classroom.findMany({
        include: { grade: true }
    });
    console.log(JSON.stringify(classrooms, null, 2));
}

main().finally(() => prisma.$disconnect());
