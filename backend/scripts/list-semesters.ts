import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const semesters = await prisma.semester.findMany({
        include: {
            academicYear: true
        }
    });
    console.log(JSON.stringify(semesters, null, 2));
}

main().finally(() => prisma.$disconnect());
