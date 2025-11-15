import { UserRole } from "generated/prisma";

export type JSON_WEB_TOKEN_Payload={
    sub:string;
    role:UserRole
}