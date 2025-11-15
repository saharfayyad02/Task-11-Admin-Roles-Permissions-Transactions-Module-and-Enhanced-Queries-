import { User } from "generated/prisma";
import z, { ZodType } from "zod";
import { UpdateUserDto } from "../dto/update-user.dto";

export const UserValidationSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.email(),
    password: z.string(),
    role: z.enum(['MERCHANT','CUSTOMER','ADMIN']),
}) satisfies ZodType <Omit<User ,'id' | 'createdAt' |'isDeleted' >>;

export const updatedUserValidationSchema = 
UserValidationSchema.
pick({name:true,email:true}).partial() satisfies ZodType<UpdateUserDto>;