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

    async resolveSemesterId(semesterValue: string): Promise<string> {
        if (!semesterValue) return '';

        // Check if it's a placeholder like "2024-2" (Year-Term)
        const placeholderRegex = /^(\d{4})-(\d)$/;
        const match = semesterValue.match(placeholderRegex);

        if (match) {
            const year = parseInt(match[1]);
            const term = parseInt(match[2]);

            // 1. Ensure School exists (assuming one school for now)
            let school = await this.prisma.school.findFirst();
            if (!school) {
                school = await this.prisma.school.create({
                    data: { name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์' }
                });
            }

            // 2. Ensure AcademicYear exists
            let acYear = await this.prisma.academicYear.findFirst({
                where: { year, schoolId: school.id }
            });

            if (!acYear) {
                acYear = await this.prisma.academicYear.create({
                    data: {
                        year,
                        schoolId: school.id,
                        semesters: {
                            create: [
                                { term: 1 },
                                { term: 2 }
                            ]
                        }
                    }
                });
                console.log(`[SchoolService] Created default academic year and semesters for ${year}`);
            }

            // 3. Find specific Semester
            let semester = await this.prisma.semester.findFirst({
                where: { term, academicYearId: acYear.id }
            });

            if (!semester) {
                semester = await this.prisma.semester.create({
                    data: { term, academicYearId: acYear.id }
                });
            }

            return semester.id;
        }

        // It's already a UUID or something else, return as is (and let Prisma validate if it exists)
        return semesterValue || '';
    }

    async getClassrooms(rawSemesterId: string) {
        const semesterId = await this.resolveSemesterId(rawSemesterId);
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

    // Learning Materials
    async getLearningMaterials(subjectId: string) {
        return this.prisma.learningMaterial.findMany({
            where: { subjectId },
            include: {
                teacher: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createLearningMaterial(data: { title: string; description?: string; fileUrl: string; fileType?: string; subjectId: string; teacherId: string }) {
        return this.prisma.learningMaterial.create({
            data: {
                title: data.title,
                description: data.description,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                subjectId: data.subjectId,
                teacherId: data.teacherId
            }
        });
    }

    async deleteLearningMaterial(id: string) {
        return this.prisma.learningMaterial.delete({ where: { id } });
    }
}
