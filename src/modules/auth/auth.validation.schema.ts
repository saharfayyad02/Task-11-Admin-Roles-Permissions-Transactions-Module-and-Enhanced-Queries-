import { ZodType } from 'zod';
import { LoginDTO } from './dto/auth.dto';
import { UserValidationSchema } from '../user/util/user.validation.schema';

// register = base schema
export const registerValidationSchema = UserValidationSchema;

// login = pick email and password from base schema
export const loginValidationSchema = UserValidationSchema.pick({
  email: true,
  password: true,
}) satisfies ZodType<LoginDTO>;