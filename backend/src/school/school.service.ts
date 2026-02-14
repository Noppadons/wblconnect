import { Injectable, ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto, CreateMaterialDto } from './dto/school.dto';

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
      // Use upsert to handle potential race condition if multiple teachers trigger this
      const school = await this.prisma.school.upsert({
        where: { id: 'default-school-id' }, // Assuming we can use a stable ID or just use findFirst and create
        update: {},
        create: {
          id: 'default-school-id',
          name: 'โรงเรียนวัดบึงเหล็ก ในพระบรมราชานุเคราะห์'
        },
      });

      // 2. Ensure AcademicYear exists
      // Use a unique constraint-like approach with findFirst/create or ideally a unique constraint on [year, schoolId]
      // Since schema doesn't have it yet, we use a simple findFirst but wrap it in a try-catch for unique violations if we had the constraint.
      // For now, let's stick to a safer findFirst/create pattern or better yet, update schema later.

      let acYear = await this.prisma.academicYear.findFirst({
        where: { year, schoolId: school.id },
      });

      if (!acYear) {
        try {
          acYear = await this.prisma.academicYear.create({
            data: {
              year,
              schoolId: school.id,
              semesters: {
                create: [{ term: 1 }, { term: 2 }],
              },
            },
          });
        } catch (e) {
          // If creation fails due to race, find it again
          acYear = await this.prisma.academicYear.findFirst({
            where: { year, schoolId: school.id },
          });
        }
      }

      // 3. Find specific Semester
      let semester = await this.prisma.semester.findFirst({
        where: { term, academicYearId: acYear?.id },
      });

      if (!semester && acYear) {
        try {
          semester = await this.prisma.semester.create({
            data: { term, academicYearId: acYear.id },
          });
        } catch (e) {
          semester = await this.prisma.semester.findFirst({
            where: { term, academicYearId: acYear.id },
          });
        }
      }

      return semester?.id || '';
    }

    // It's already a UUID or something else, return as is (and let Prisma validate if it exists)
    return semesterValue || '';
  }

  async getAllClassrooms() {
    return this.prisma.classroom.findMany({
      include: {
        grade: true,
        homeroomTeacher: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        _count: {
          select: { students: true, subjects: true },
        },
      },
      orderBy: [{ grade: { level: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async getClassrooms(rawSemesterId?: string) {
    const where: any = {};
    if (rawSemesterId && rawSemesterId !== 'undefined' && rawSemesterId.trim() !== '') {
      const resolved = await this.resolveSemesterId(rawSemesterId);
      if (resolved) {
        where.semesterId = resolved;
      }
    }

    return this.prisma.classroom.findMany({
      where,
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
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ grade: { level: 'asc' } }, { roomNumber: 'asc' }],
    });
  }

  async getTeacherClassrooms(userId: string) {
    const classrooms = await this.prisma.classroom.findMany({
      where: {
        OR: [
          { homeroomTeacher: { userId } },
          { subjects: { some: { teacher: { userId } } } },
        ],
      },
      include: {
        grade: true,
        students: {
          include: { user: true },
          orderBy: { studentCode: 'asc' },
        },
        homeroomTeacher: {
          include: { user: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    return classrooms.map((c) => ({
      ...c,
      isHomeroom: c.homeroomTeacher?.userId === userId,
    }));
  }

  async getTeacherClassroomsCategorized(userId: string) {
    const classrooms = await this.getTeacherClassrooms(userId);

    const homeroom = classrooms.find((c) => c.isHomeroom) || null;
    const taught = classrooms.filter((c) => !c.isHomeroom);

    return {
      homeroom,
      taught,
    };
  }

  async getStudentsByClassrooms(userId: string, classroomIds: string[]) {
    // SECURITY CHECK: Ensure teacher teaches these classrooms or is an ADMIN
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') {
      const accessCount = await this.prisma.classroom.count({
        where: {
          id: { in: classroomIds },
          OR: [
            { homeroomTeacher: { userId } },
            { subjects: { some: { teacher: { userId } } } },
          ],
        },
      });

      if (accessCount !== classroomIds.length) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงบางห้องเรียนที่เลือก');
      }
    }

    return this.prisma.student.findMany({
      where: { classroomId: { in: classroomIds } },
      include: {
        user: true,
        classroom: { include: { grade: true } },
      },
      orderBy: [{ classroomId: 'asc' }, { studentCode: 'asc' }],
    });
  }

  async getGradeLevels() {
    return this.prisma.gradeLevel.findMany();
  }
  async getSubjects() {
    return this.prisma.subject.findMany({
      include: {
        teacher: { include: { user: true } },
        classroom: { include: { grade: true } },
      },
    });
  }

  async createSubject(data: CreateSubjectDto) {
    if (!data.teacherId) {
      throw new BadRequestException('กรุณาระบุครูผู้สอน');
    }

    return this.prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        credit: data.credit,
        teacherId: data.teacherId,
        classroomId: data.classroomId || null,
      },
    });
  }

  async updateSubject(id: string, data: UpdateSubjectDto) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.credit !== undefined) updateData.credit = data.credit;
    if (data.teacherId) updateData.teacherId = data.teacherId;
    if (data.classroomId !== undefined)
      updateData.classroomId = data.classroomId || null;

    return this.prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { include: { user: true } },
        classroom: { include: { grade: true } },
      },
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
        teacher: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentMaterials(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, classroomId: true },
    });
    if (!student) return [];

    const materials = await this.prisma.learningMaterial.findMany({
      where: {
        OR: [
          {
            subject: {
              classroomId: student.classroomId,
            },
          },
          {
            subject: {
              students: {
                some: {
                  studentId: student.id,
                },
              },
            },
          },
          {
            subject: {
              schedules: {
                some: {
                  classroomId: student.classroomId,
                },
              },
            },
          },
        ],
      },
      include: {
        teacher: { include: { user: true } },
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return materials;
  }

  async createLearningMaterial(data: {
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    subjectId: string;
    teacherId: string;
  }) {
    return this.prisma.learningMaterial.create({
      data: {
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });
  }

  async deleteLearningMaterial(id: string) {
    return this.prisma.learningMaterial.delete({ where: { id } });
  }

  async createLearningMaterialAsTeacher(userId: string, data: CreateMaterialDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        subjects: { where: { id: data.subjectId } },
      },
    });

    if (!teacher) throw new ForbiddenException('ไม่พบข้อมูลโปรไฟล์ครู');
    if (teacher.subjects.length === 0) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เพิ่มสื่อการสอนในวิชานี้');
    }

    return this.createLearningMaterial({
      ...data,
      teacherId: teacher.id,
    });
  }

  async deleteLearningMaterialAsTeacher(userId: string, materialId: string) {
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { teacher: true },
    });

    if (!material) throw new NotFoundException('ไม่พบสื่อการสอน');
    if (material.teacher.userId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบสื่อการสอนของผู้อื่น');
    }

    return this.deleteLearningMaterial(materialId);
  }
}
