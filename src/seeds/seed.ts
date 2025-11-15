// prisma client instance
// function main // delete all records from user and product tables
import { PrismaClient } from "generated/prisma";
import { AdminUser, generateUserSeed } from "./user.seed";
import { generateProductSeed } from "./product.seed";
import { faker } from "@faker-js/faker";
import * as argon from 'argon2';

const prisma = new PrismaClient();

const ADMIN_NAME  = process.env.ADMIN_NAME  ?? 'Super Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'ChangeMe_123!';

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

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
   if (!existing) {
    const password = await argon.hash(ADMIN_PASS);
    await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password,
        role: 'ADMIN', 
      },
    });
    console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
  } else if (existing.role !== 'ADMIN') {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ Promoted existing user to ADMIN: ${ADMIN_EMAIL}`);
  } else {
    console.log('ℹ️ Admin already exists, no changes.');
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