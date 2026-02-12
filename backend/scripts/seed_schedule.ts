
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding schedules...');

    // 1. Get classroom and subjects
    const classrooms = await prisma.classroom.findMany({
        include: { subjects: true }
    });

    if (classrooms.length === 0) {
        console.log('❌ No classrooms found. Please ensure data exists before seeding schedules.');
        return;
    }

    for (const classroom of classrooms) {
        const subjects = classroom.subjects;
        if (subjects.length === 0) continue;

        console.log(`Seeding schedule for Classroom: ${classroom.roomNumber}`);

        // Create a few entries for Monday and Tuesday
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

        for (let i = 0; i < Math.min(subjects.length, 5); i++) {
            const subject = subjects[i];
            const day = days[i % 5];
            const period = (i % 4) + 1; // Period 1-4

            await prisma.schedule.upsert({
                where: {
                    dayOfWeek_periodStart_classroomId: {
                        dayOfWeek: day,
                        periodStart: period,
                        classroomId: classroom.id
                    }
                },
                update: {},
                create: {
                    dayOfWeek: day,
                    periodStart: period,
                    periodEnd: period + 1, // 2 periods long
                    subjectId: subject.id,
                    classroomId: classroom.id,
                    teacherId: subject.teacherId
                }
            });
        }
    }

    console.log('✅ Schedule seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
