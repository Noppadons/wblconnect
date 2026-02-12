import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Clear existing data (optional but good for clean seed)
    console.log('Cleaning up existing data...');
    // Delete in order of dependencies (leaves first, then parents)
    await prisma.attendance.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.studentSubject.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.behaviorLog.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.classroom.deleteMany();
    await prisma.semester.deleteMany();
    await prisma.academicYear.deleteMany();
    await prisma.user.deleteMany();
    await prisma.gradeLevel.deleteMany();
    await prisma.school.deleteMany();

    // 0. Create Admin User
    await prisma.user.create({
        data: {
            email: 'admin@school.com',
            password: hashedPassword,
            firstName: 'ผู้ดูแล',
            lastName: 'ระบบ',
            role: 'ADMIN',
        },
    });
    console.log('Admin user created: admin@school.com / 123456');

    // 1. Create School
    const school = await prisma.school.create({
        data: {
            name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์',
        },
    });

    // 2. Create Academic Year & Semester
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

    // 3. Create Grade Levels (M.1 - M.6)
    const grades = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    const gradeLevels = await Promise.all(
        grades.map(level => prisma.gradeLevel.create({ data: { level } }))
    );

    // 4. Create Teachers (15 Teachers)
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

    // 5. Create Classrooms (12 Classrooms: 2 per grade)
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

    // 6. Create Subjects (OBEC Standards) - Assigned to classrooms and teachers
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

    console.log('Generating subjects for each classroom...');
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

    // 7. Create Students (250 Students)
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

    console.log(`Seed completed: 15 Teachers, 12 Classrooms, 250 Students created.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
