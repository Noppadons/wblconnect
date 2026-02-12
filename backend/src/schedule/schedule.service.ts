import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ScheduleService {
    constructor(private prisma: PrismaService) { }

    async findMySchedule(user: any) {
        if (user.role === Role.STUDENT) {
            const student = await this.prisma.student.findUnique({
                where: { userId: user.id },
            });
            if (!student) throw new NotFoundException('ไม่พบข้อมูลนักเรียน');
            return this.findByClassroom(student.classroomId);
        } else if (user.role === Role.TEACHER) {
            const teacher = await this.prisma.teacher.findUnique({
                where: { userId: user.id },
            });
            if (!teacher) throw new NotFoundException('ไม่พบข้อมูลครู');
            return this.findByTeacher(teacher.id);
        }
        return [];
    }

    async create(data: any) {
        // Check for conflicts in classroom
        const classroomConflict = await this.prisma.schedule.findFirst({
            where: {
                dayOfWeek: data.dayOfWeek,
                classroomId: data.classroomId,
                AND: [
                    { periodStart: { lte: parseInt(data.periodEnd) } },
                    { periodEnd: { gte: parseInt(data.periodStart) } }
                ]
            }
        });

        if (classroomConflict) {
            throw new ConflictException('ห้องเรียนมีการสอนในเวลานี้อยู่แล้ว (Classroom conflict)');
        }

        // Check for conflicts for teacher
        const teacherConflict = await this.prisma.schedule.findFirst({
            where: {
                dayOfWeek: data.dayOfWeek,
                teacherId: data.teacherId,
                AND: [
                    { periodStart: { lte: parseInt(data.periodEnd) } },
                    { periodEnd: { gte: parseInt(data.periodStart) } }
                ]
            }
        });

        if (teacherConflict) {
            throw new ConflictException('ครูผู้สอนมีตารางสอนอื่นในเวลานี้อยู่แล้ว (Teacher conflict)');
        }

        return this.prisma.schedule.create({
            data: {
                dayOfWeek: data.dayOfWeek,
                periodStart: parseInt(data.periodStart),
                periodEnd: parseInt(data.periodEnd),
                subjectId: data.subjectId,
                classroomId: data.classroomId,
                teacherId: data.teacherId,
            }
        });
    }

    async findByClassroom(classroomId: string) {
        return this.prisma.schedule.findMany({
            where: { classroomId },
            include: {
                subject: true,
                teacher: {
                    include: { user: true }
                }
            },
            orderBy: [
                { periodStart: 'asc' }
            ]
        });
    }

    async findByTeacher(teacherId: string) {
        return this.prisma.schedule.findMany({
            where: { teacherId },
            include: {
                subject: true,
                classroom: {
                    include: { grade: true }
                }
            },
            orderBy: [
                { periodStart: 'asc' }
            ]
        });
    }

    async findAll() {
        return this.prisma.schedule.findMany({
            include: {
                subject: true,
                teacher: {
                    include: { user: true }
                },
                classroom: {
                    include: { grade: true }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { periodStart: 'asc' }
            ]
        });
    }

    async remove(id: string) {
        return this.prisma.schedule.delete({
            where: { id }
        });
    }
}
