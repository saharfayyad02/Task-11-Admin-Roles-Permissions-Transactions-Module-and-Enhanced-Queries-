import ImageKit from "@imagekit/nodejs";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "src/types/decleration-merging";

export const ImageKitToken = "ImageKitProvider";
export const imageKitProvider = {
    provide: ImageKitToken,
    useFactory:(configService:ConfigService<EnvVariables>)=>{
          return new ImageKit({
             privateKey:configService.getOrThrow('IMAGEKIT_PRIVATE_KEY'),
          })

    },
    inject:[ConfigService],
};