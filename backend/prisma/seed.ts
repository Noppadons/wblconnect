import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Force use of direct URL for seeding to avoid PgBouncer issues
if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('12345678', 10);

    console.log('--- FULL DB SEED (DIRECT CONNECTION) ---');

    // 0. Cleanup
    const tables = [
        'Attendance', 'Submission', 'Assignment', 'Schedule',
        'StudentSubject', 'Subject', 'BehaviorLog', 'Student',
        'Teacher', 'Classroom', 'Semester', 'AcademicYear',
        'UserNotification', 'Notification', 'User', 'GradeLevel', 'School'
    ];

    console.log('Cleaning up existing data...');
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
            console.log(`- Truncated ${table}`);
        } catch (err) {
            // console.warn(`- Skip ${table}`);
        }
    }

    // 1. Create Admin User
    await prisma.user.create({
        data: {
            email: 'admin@school.com',
            password: hashedPassword,
            firstName: 'ผู้ดูแล',
            lastName: 'ระบบ',
            role: 'ADMIN',
        },
    });
    console.log('Admin user created: admin@school.com / 12345678');

    // 2. Create School
    const school = await prisma.school.create({
        data: {
            name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์',
        },
    });

    // 3. Create Academic Year & Semester
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
        include: { semesters: true },
    });

    const semester1 = academicYear.semesters.find(s => s.term === 1);
    if (!semester1) throw new Error('Semester 1 not found');

    // 4. Create Grade Levels
    const grades = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    const gradeLevels = await Promise.all(
        grades.map(level => prisma.gradeLevel.create({ data: { level } }))
    );

    // 5. Create Teachers (15 Teachers)
    const teachers: any[] = [];
    const teacherNames = [
        { first: 'สมชาย', last: 'รักเรียน' }, { first: 'สมหญิง', last: 'จริงใจ' },
        { first: 'บุญมี', last: 'มีชัย' }, { first: 'มานี', last: 'มีปัญญา' },
        { first: 'ชูใจ', last: 'ใจดี' }, { first: 'ปิติ', last: 'ยินดี' },
        { first: 'วีระ', last: 'หาญกล้า' }, { first: 'สมศักดิ์', last: 'เพียรพยายาม' },
        { first: 'วิภา', last: 'ส่องแสง' }, { first: 'จันทรา', last: 'สว่างจิต' },
        { first: 'พรทิพย์', last: 'มงคล' }, { first: 'ชัยธวัช', last: 'ธงชัย' },
        { first: 'กานดา', last: 'นวลใย' }, { first: 'เอกชัย', last: 'ชัยชนะ' },
        { first: 'สุดา', last: 'พึ่งธรรม' }
    ];

    for (let i = 0; i < teacherNames.length; i++) {
        const t = teacherNames[i];
        const user = await prisma.user.create({
            data: {
                email: `teacher${i + 1}@school.com`,
                password: hashedPassword,
                firstName: t.first,
                lastName: t.last,
                role: 'TEACHER',
                teacher: { create: {} },
            },
            include: { teacher: true },
        });
        teachers.push(user.teacher);
    }

    // 6. Create Classrooms
    const classrooms: any[] = [];
    for (let i = 0; i < gradeLevels.length; i++) {
        for (let room = 1; room <= 2; room++) {
            const classroom = await prisma.classroom.create({
                data: {
                    roomNumber: room.toString(),
                    gradeId: gradeLevels[i].id,
                    semesterId: semester1.id,
                    homeroomTeacherId: teachers[(i * 2 + (room - 1)) % teachers.length]!.id,
                },
            });
            classrooms.push(classroom);
        }
    }

    // 7. Create Subjects
    const subjects = [
        { name: 'ภาษาไทย', code: 'ท' },
        { name: 'คณิตศาสตร์', code: 'ค' },
        { name: 'วิทยาศาสตร์และเทคโนโลยี', code: 'ว' },
        { name: 'สังคมศึกษา ศาสนา และวัฒนธรรม', code: 'ส' },
        { name: 'สุขศึกษาและพลศึกษา', code: 'พ' },
        { name: 'ศิลปะ', code: 'ศ' },
        { name: 'การงานอาชีพ', code: 'ง' },
        { name: 'ภาษาอังกฤษ', code: 'อ' }
    ];

    for (const classroom of classrooms) {
        for (let i = 0; i < subjects.length; i++) {
            const s = subjects[i];
            await prisma.subject.create({
                data: {
                    name: s.name,
                    code: s.code,
                    classroomId: classroom.id,
                    teacherId: teachers[i % teachers.length].id,
                    semesterId: semester1.id
                }
            });
        }
    }

    // 8. Create Students (250 Students)
    console.log('Generating 250 students...');
    const studentCountPerRoom = Math.floor(250 / classrooms.length);
    let currentStudentTotal = 0;

    for (let i = 0; i < classrooms.length; i++) {
        const targetCount = (i === classrooms.length - 1) ? (250 - currentStudentTotal) : studentCountPerRoom;

        for (let j = 0; j < targetCount; j++) {
            currentStudentTotal++;
            const studentCode = `67${currentStudentTotal.toString().padStart(3, '0')}`;
            await prisma.user.create({
                data: {
                    email: `student${currentStudentTotal}@school.com`,
                    password: hashedPassword,
                    firstName: `นักเรียน`,
                    lastName: `คนที่ ${currentStudentTotal}`,
                    role: 'STUDENT',
                    student: {
                        create: {
                            studentCode: studentCode,
                            classroomId: classrooms[i].id,
                        },
                    },
                },
            });
        }
    }

    console.log(`Seed completed successfully: 1 Admin, 15 Teachers, 12 Classrooms, 250 Students.`);
}

main()
    .catch((e) => {
        console.error('Seed error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
