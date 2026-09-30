const prisma = require("../prismaClient");

async function testDatabase() {
    try {
        const users = await prisma.Users.findMany({
            take: 1
        });

        console.log("Prisma connected to PostgreSQL");
        console.log("Users table is accessible");
        console.log(users);
    } catch (error) {
        console.error("Database test failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();