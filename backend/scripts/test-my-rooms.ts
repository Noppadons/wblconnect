import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userId = 'bed3c6bc-16bc-4aa8-897f-7a9141ef79e5';
    const myRooms = await prisma.classroom.findMany({
        where: {
            OR: [
                { homeroomTeacher: { userId } },
                { subjects: { some: { teacher: { userId } } } }
            ]
        },
        include: {
            grade: true,
            homeroomTeacher: { include: { user: true } },
            students: { include: { user: true } }
        }
    });
    console.log('My Rooms:', JSON.stringify(myRooms, null, 2));
}

main().finally(() => prisma.$disconnect());
