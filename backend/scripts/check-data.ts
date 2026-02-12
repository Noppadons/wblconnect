import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const classroomCount = await prisma.classroom.count();
    const semesterCount = await prisma.semester.count();
    const semesters = await prisma.semester.findMany();

    console.log({
        classroomCount,
        semesterCount,
        semesters
    });
}

main().finally(() => prisma.$disconnect());
