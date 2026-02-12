import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolService {
    constructor(private prisma: PrismaService) { }

    async getSchoolInfo() {
        return this.prisma.school.findFirst();
    }

    async getAcademicYears() {
        return this.prisma.academicYear.findMany({
            include: { semesters: true },
        });
    }

    async getClassrooms(semesterId: string) {
        return this.prisma.classroom.findMany({
            where: { semesterId },
            include: {
                grade: true,
                homeroomTeacher: {
                    include: {
                        user: true,
                    },
                },
                students: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async getTeacherClassrooms(userId: string) {
        return this.prisma.classroom.findMany({
            where: {
                OR: [
                    { homeroomTeacher: { userId } },
                    { subjects: { some: { teacher: { userId } } } }
                ]
            },
            include: {
                grade: true,
                students: {
                    include: { user: true },
                    orderBy: { studentCode: 'asc' }
                },
                homeroomTeacher: {
                    include: { user: true }
                },
                _count: {
                    select: { students: true }
                }
            }
        });
    }

    async getGradeLevels() {
        return this.prisma.gradeLevel.findMany();
    }
    async getSubjects() {
        return this.prisma.subject.findMany({
            include: {
                teacher: { include: { user: true } },
                classroom: { include: { grade: true } }
            }
        });
    }

    async createSubject(data: any) {
        return this.prisma.subject.create({
            data: {
                name: data.name,
                code: data.code,
                credit: parseFloat(data.credit),
                teacherId: data.teacherId,
                classroomId: data.classroomId || null
            }
        });
    }

    async updateSubject(id: string, data: any) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.code) updateData.code = data.code;
        if (data.credit) updateData.credit = parseFloat(data.credit);
        if (data.teacherId) updateData.teacherId = data.teacherId;
        if (data.classroomId !== undefined) updateData.classroomId = data.classroomId || null;

        return this.prisma.subject.update({
            where: { id },
            data: updateData,
            include: {
                teacher: { include: { user: true } },
                classroom: { include: { grade: true } }
            }
        });
    }

    async deleteSubject(id: string) {
        return this.prisma.subject.delete({ where: { id } });
    }
}
