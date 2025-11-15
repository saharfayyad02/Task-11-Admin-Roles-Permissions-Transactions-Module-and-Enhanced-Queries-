import { User } from "generated/prisma";
import { faker } from "@faker-js/faker";
import * as argon from 'argon2'
export const generateUserSeed = () =>{
    const seedUser :Omit<User,'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> = {
        email: faker.internet.email(),
        name: faker.person.fullName(),    
        password: faker.internet.password(),
        role:faker.helpers.arrayElement(['CUSTOMER','MERCHANT']),
    }
return seedUser;
};

export const AdminUser= async()=>({
    name: 'Admin User',
    email: 'Admin@gmail.com',
    password: await argon.hash('Admin@123'),
    role: 'MERCHANT',
}) as const;