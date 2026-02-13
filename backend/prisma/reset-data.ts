/**
 * Reset Database Script
 * ลบข้อมูลทั้งหมดยกเว้น Admin users
 * 
 * Usage: npx ts-node prisma/reset-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 ตรวจสอบ Admin users...');
  
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (admins.length === 0) {
    console.log('❌ ไม่พบ Admin user — ยกเลิกการล้างข้อมูล');
    return;
  }

  console.log(`✅ พบ Admin ${admins.length} คน:`);
  admins.forEach(a => console.log(`   - ${a.email} (${a.firstName} ${a.lastName})`));
  console.log('');

  const adminIds = admins.map(a => a.id);

  // ลบตามลำดับ dependency (child → parent)
  console.log('🗑️  กำลังล้างข้อมูล...');

  // 1. Attendance, BehaviorLog, Submission (leaf tables ที่ขึ้นกับ Student)
  const delAttendance = await prisma.attendance.deleteMany({});
  console.log(`   ✓ Attendance: ${delAttendance.count} records`);

  const delBehavior = await prisma.behaviorLog.deleteMany({});
  console.log(`   ✓ BehaviorLog: ${delBehavior.count} records`);

  const delSubmission = await prisma.submission.deleteMany({});
  console.log(`   ✓ Submission: ${delSubmission.count} records`);

  // 2. StudentSubject
  const delStudentSubject = await prisma.studentSubject.deleteMany({});
  console.log(`   ✓ StudentSubject: ${delStudentSubject.count} records`);

  // 3. UserNotification, Notification
  const delUserNotif = await prisma.userNotification.deleteMany({});
  console.log(`   ✓ UserNotification: ${delUserNotif.count} records`);

  const delNotif = await prisma.notification.deleteMany({});
  console.log(`   ✓ Notification: ${delNotif.count} records`);

  // 4. Schedule
  const delSchedule = await prisma.schedule.deleteMany({});
  console.log(`   ✓ Schedule: ${delSchedule.count} records`);

  // 5. LearningMaterial
  const delMaterial = await prisma.learningMaterial.deleteMany({});
  console.log(`   ✓ LearningMaterial: ${delMaterial.count} records`);

  // 6. Assignment (depends on Subject)
  const delAssignment = await prisma.assignment.deleteMany({});
  console.log(`   ✓ Assignment: ${delAssignment.count} records`);

  // 7. Subject (depends on Teacher, Classroom)
  const delSubject = await prisma.subject.deleteMany({});
  console.log(`   ✓ Subject: ${delSubject.count} records`);

  // 8. Student (depends on User, Classroom) — ลบ Student ก่อน User
  const delStudent = await prisma.student.deleteMany({});
  console.log(`   ✓ Student: ${delStudent.count} records`);

  // 9. Teacher (depends on User) — ลบ Teacher ก่อน User
  const delTeacher = await prisma.teacher.deleteMany({});
  console.log(`   ✓ Teacher: ${delTeacher.count} records`);

  // 10. Classroom (depends on GradeLevel, Semester)
  const delClassroom = await prisma.classroom.deleteMany({});
  console.log(`   ✓ Classroom: ${delClassroom.count} records`);

  // 11. GradeLevel
  const delGrade = await prisma.gradeLevel.deleteMany({});
  console.log(`   ✓ GradeLevel: ${delGrade.count} records`);

  // 12. Semester → AcademicYear → School
  const delSemester = await prisma.semester.deleteMany({});
  console.log(`   ✓ Semester: ${delSemester.count} records`);

  const delAcYear = await prisma.academicYear.deleteMany({});
  console.log(`   ✓ AcademicYear: ${delAcYear.count} records`);

  const delSchool = await prisma.school.deleteMany({});
  console.log(`   ✓ School: ${delSchool.count} records`);

  // 13. User — ลบเฉพาะที่ไม่ใช่ ADMIN
  const delUser = await prisma.user.deleteMany({
    where: { id: { notIn: adminIds } },
  });
  console.log(`   ✓ User (non-admin): ${delUser.count} records`);

  console.log('');
  console.log('✅ ล้างข้อมูลเสร็จสิ้น!');
  console.log(`📌 เหลือ Admin ${admins.length} คน พร้อมทดสอบจริง`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
