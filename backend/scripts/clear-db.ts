import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Cleanup Started ---');

    try {
        // 1. Delete relations/child tables first
        console.log('Cleaning up activity and relation tables...');
        await prisma.attendance.deleteMany();
        await prisma.submission.deleteMany();
        await prisma.behaviorLog.deleteMany();
        await prisma.studentSubject.deleteMany();
        await prisma.schedule.deleteMany();
        await prisma.notification.deleteMany();

        // 2. Delete main entities
        console.log('Cleaning up assignments, subjects, and classrooms...');
        await prisma.assignment.deleteMany();
        await prisma.subject.deleteMany();
        await prisma.classroom.deleteMany();

        // 3. Delete education structure
        console.log('Cleaning up semester and academic year structure...');
        await prisma.semester.deleteMany();
        await prisma.academicYear.deleteMany();
        await prisma.gradeLevel.deleteMany();

        // 4. Delete Students and Teachers
        console.log('Cleaning up student and teacher profiles...');
        await prisma.student.deleteMany();
        await prisma.teacher.deleteMany();

        // 5. Delete non-admin Users
        console.log('Cleaning up non-admin users...');
        const deleteUsers = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN',
                },
            },
        });
        console.log(`Deleted ${deleteUsers.count} non-admin users.`);

        // 6. Delete School (Optional: usually keep 1 school record, but clearing as requested)
        // await prisma.school.deleteMany();

        console.log('--- Database Cleanup Completed Successfully ---');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
