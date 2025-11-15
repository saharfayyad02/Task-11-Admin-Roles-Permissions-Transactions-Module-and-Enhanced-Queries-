import { Product } from "generated/prisma";
import { faker } from "@faker-js/faker";

export const generateProductSeed = (merchantId : bigint) =>{
    const seedProduct :Omit<Product,'id' | 'isDeleted' | 'price'> & { price : number } = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.number.int({ min: 100, max: 10000 }),
        merchantId: merchantId,
    }
return seedProduct;
};
