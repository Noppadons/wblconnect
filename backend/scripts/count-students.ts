import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const studentCount = await prisma.student.count({
        where: { classroomId: '142b620d-dc5b-4f0d-b671-e42597e01b0c' }
    });
    console.log('Student Count for Room 1:', studentCount);

    const allStudents = await prisma.student.findMany({
        where: { classroomId: '142b620d-dc5b-4f0d-b671-e42597e01b0c' },
        include: { user: true }
    });
    console.log('Students:', JSON.stringify(allStudents, null, 2));
}

main().finally(() => prisma.$disconnect());
