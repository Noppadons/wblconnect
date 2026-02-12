import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
    constructor(private prisma: PrismaService) { }

    async createAssignment(data: any) {
        return this.prisma.assignment.create({
            data: {
                title: data.title,
                description: data.description || null,
                maxPoints: data.maxPoints,
                subjectId: data.subjectId,
                classroomId: data.classroomId,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
        });
    }

    async submitAssignment(data: { studentId: string; assignmentId: string; content?: string }) {
        return this.prisma.submission.upsert({
            where: {
                studentId_assignmentId: {
                    studentId: data.studentId,
                    assignmentId: data.assignmentId
                }
            },
            update: {
                status: 'SUBMITTED',
                updatedAt: new Date()
            },
            create: {
                studentId: data.studentId,
                assignmentId: data.assignmentId,
                status: 'SUBMITTED'
            }
        });
    }

    async gradeSubmission(submissionId: string, points: number, feedback?: string) {
        return this.prisma.submission.update({
            where: { id: submissionId },
            data: {
                points,
                feedback,
                status: 'GRADED'
            }
        });
    }

    async getAssignmentsByClassroom(classroomId: string) {
        return this.prisma.assignment.findMany({
            where: { classroomId },
            include: {
                subject: true,
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAssignmentGradebook(assignmentId: string) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                subject: true,
                classroom: {
                    include: {
                        students: {
                            include: {
                                user: true,
                                submissions: {
                                    where: { assignmentId }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) throw new Error('Assignment not found');

        // Format for easy consumption by the frontend gradebook table
        return {
            id: assignment.id,
            title: assignment.title,
            maxPoints: assignment.maxPoints,
            subject: assignment.subject,
            students: assignment.classroom?.students.map(s => ({
                id: s.id,
                name: `${s.user.firstName} ${s.user.lastName}`,
                studentCode: s.studentCode,
                submission: s.submissions[0] || null
            })) || []
        };
    }

    async bulkUpdateGrades(assignmentId: string, grades: { studentId: string; points: number; feedback?: string }[]) {
        const updates = grades.map(g =>
            this.prisma.submission.upsert({
                where: {
                    studentId_assignmentId: {
                        studentId: g.studentId,
                        assignmentId
                    }
                },
                update: {
                    points: g.points,
                    feedback: g.feedback,
                    status: 'GRADED'
                },
                create: {
                    studentId: g.studentId,
                    assignmentId,
                    points: g.points,
                    feedback: g.feedback,
                    status: 'GRADED'
                }
            })
        );

        return Promise.all(updates);
    }

    async enrollStudent(studentId: string, subjectId: string) {
        return this.prisma.studentSubject.create({
            data: {
                studentId,
                subjectId,
            },
        });
    }

    async updateSubjectGrade(studentId: string, subjectId: string, grade: number) {
        const result = await this.prisma.studentSubject.update({
            where: {
                studentId_subjectId: {
                    studentId,
                    subjectId,
                },
            },
            data: { grade },
        });

        // **Optimization**: Auto-recalculate GPA to keep data consistent
        await this.calculateGPA(studentId);

        return result;
    }

    async calculateGPA(studentId: string) {
        const enrollments = await this.prisma.studentSubject.findMany({
            where: { studentId },
            include: { subject: true },
        });

        let totalPoints = 0;
        let totalCredits = 0;

        for (const enrollment of enrollments) {
            if (enrollment.grade !== null) {
                totalPoints += enrollment.grade * enrollment.subject.credit;
                totalCredits += enrollment.subject.credit;
            }
        }

        const gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.00;

        // **Optimization**: Update the student's GPA in the database for fast querying
        await this.prisma.student.update({
            where: { id: studentId },
            data: { gpa: gpa }
        });

        return gpa;
    }

    async getStudentPerformance(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { gpa: true }
        });

        const submissions = await this.prisma.submission.findMany({
            where: { studentId },
            include: {
                assignment: {
                    include: { subject: true },
                },
            },
        });

        return {
            gpa: student?.gpa || 0.00,
            submissions,
        };
    }

    async getEarlyWarningStudents() {
        // Optimization: Use groupBy to find IDs of students with >= 3 absences directly in DB
        const highAbsenceGroups = await this.prisma.attendance.groupBy({
            by: ['studentId'],
            where: {
                status: 'ABSENT',
            },
            _count: {
                id: true,
            },
            having: {
                id: {
                    _count: {
                        gte: 3,
                    },
                },
            },
        });

        const studentIds = highAbsenceGroups.map((g) => g.studentId);

        const highAbsenceStudents = await this.prisma.student.findMany({
            where: {
                id: { in: studentIds },
            },
            include: {
                user: true,
                // Only include the count if needed, or nothing at all to keep it lean
            },
        });

        // Rule 2: Low GPA (< 2.0)
        // **Optimization**: Direct DB query using the indexed 'gpa' field (O(1))
        const lowGpaStudents = await this.prisma.student.findMany({
            where: {
                gpa: {
                    lt: 2.0
                }
            },
            include: {
                user: true
            }
        });

        return {
            highAbsence: highAbsenceStudents,
            lowGpa: lowGpaStudents
        };
    }

    async getMyAssignments(userId: string) {
        const student = await this.prisma.student.findUnique({
            where: { userId },
            select: { id: true, classroomId: true }
        });

        if (!student) {
            throw new Error('Student profile not found');
        }

        const assignments = await this.prisma.assignment.findMany({
            where: { classroomId: student.classroomId },
            include: {
                subject: true,
                submissions: {
                    where: { studentId: student.id }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        return assignments.map(a => ({
            ...a,
            mySubmission: a.submissions[0] || null
        }));
    }
}
