import ImageKit from "@imagekit/nodejs";
import { RegisterDTO, UserResponseDTO } from "src/modules/auth/dto/auth.dto";

export type EnvVariables = {
    JWT_SECRET: string;
    IMAGEKIT_PRIVATE_KEY: string;
}

declare global  {
    namespace Express {

    namespace Multer {
        interface File extends ImageKit.Files.FileUploadResponse {} 
    }
     export interface Request {
        user?:UserResponseDTO['user']
    }
    }
    namespace NodeJs {
        interface ProcessEnv extends EnvVariables{}
    }
    interface BigInt {
        toJSON(): string;
    }
    
}

