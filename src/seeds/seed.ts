// prisma client instance
// function main // delete all records from user and product tables
import { PrismaClient } from "generated/prisma";
import { AdminUser, generateUserSeed } from "./user.seed";
import { generateProductSeed } from "./product.seed";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
async function main() {
  console.log("Start seeding ..."); 
    // delete all records
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("Deleted all records from user and product tables.");
    // create users
    const userseeds = faker.helpers.multiple(generateUserSeed, { count: 10 });      
    await prisma.user.createMany({
        data: [...userseeds,await AdminUser()],
    });
    const merchantUser = await prisma.user.findMany({
        where: {
            role: 'MERCHANT',
        },
    });

    const productSeeds = faker.helpers.multiple(() => generateProductSeed(merchantUser[0].id)
    , { count: 30 });   

    for(const user of merchantUser){
        const productSeed = faker.helpers.multiple(() =>
             generateProductSeed(user.id)
        , { count: 3  });   
        await prisma.product.createMany({
            data: productSeed,
        });
    }

    console.log('Created users and products.');
    await prisma.$disconnect();
    console.log("Seeding finished.");

}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});