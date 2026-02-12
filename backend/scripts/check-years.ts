import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const years = await prisma.academicYear.findMany({
        include: { semesters: true },
        orderBy: { year: 'desc' }
    });
    console.log(JSON.stringify(years, null, 2));
}

main().finally(() => prisma.$disconnect());
