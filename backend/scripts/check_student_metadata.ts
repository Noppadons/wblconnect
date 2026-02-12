import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const student = await prisma.student.findFirst({
        where: {
            user: {
                email: "noppadon08225@gmail.com"
            }
        },
        include: {
            classroom: {
                include: {
                    grade: true,
                    homeroomTeacher: {
                        include: { user: true }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(student, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
