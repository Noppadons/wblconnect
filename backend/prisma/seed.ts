import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Force use of direct URL for seeding to avoid PgBouncer issues
if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('12345678', 10);

    console.log('--- NUCLEAR DB RESET (DIRECT CONNECTION) ---');

    // 0. Cleanup ALL Tables
    const tables = [
        'Attendance', 'Submission', 'Assignment', 'Schedule',
        'StudentSubject', 'Subject', 'BehaviorLog', 'Student',
        'Teacher', 'Classroom', 'Semester', 'AcademicYear',
        'UserNotification', 'Notification', 'User', 'GradeLevel', 'School'
    ];

    console.log('Truncating ALL tables...');
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
            console.log(`- Truncated ${table}`);
        } catch (err) {
            // Ignored
        }
    }

    // 1. Create ONLY Admin User
    await prisma.user.create({
        data: {
            email: 'admin@school.com',
            password: hashedPassword,
            firstName: 'ผู้ดูแล',
            lastName: 'ระบบ',
            role: 'ADMIN',
        },
    });
    console.log('- Admin user created: admin@school.com / 12345678');

    // 2. Create Minimal School infrastructure (Needed for app to run)
    const school = await prisma.school.create({
        data: {
            name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์',
        },
    });
    console.log(`- School created: ${school.name}`);

    const academicYear = await prisma.academicYear.create({
        data: {
            year: 2567,
            schoolId: school.id,
            semesters: {
                create: [
                    { term: 1 },
                    { term: 2 },
                ],
            },
        },
    });
    console.log(`- Academic Year 2567 created with 2 semesters`);

    // 3. Create Grade Levels (Commonly needed for adding students/classrooms later)
    const grades = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    await Promise.all(
        grades.map(level => prisma.gradeLevel.create({ data: { level } }))
    );
    console.log(`- Grade levels ม.1 - ม.6 created`);

    console.log('\nSUCCESS: Database is now EMPTY except for the Admin user and basic settings.');
}

main()
    .catch((e) => {
        console.error('Reset error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
