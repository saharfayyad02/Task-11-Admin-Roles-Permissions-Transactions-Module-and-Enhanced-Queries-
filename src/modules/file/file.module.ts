import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { MulterModule } from '@nestjs/platform-express';
import { imageKitProvider } from './image.provider';

@Module({
   imports:[MulterModule.registerAsync({
         imports:[FileModule],
         useFactory:(fileService:FileService)=>{
          return {
            storage:fileService.imageKitMulterStorage(),
            limits:{ fileSize:2 * 1024 * 1024}, // 2 MB,
            fileFilter:(req,file,cb)=>{
              if(!file.mimetype.startsWith('image/')){
                return cb(new Error('Only image files are allowed!'),false);
              }
              cb(null,true);
          }
         }
        }
   ,inject:[FileService]}
   )],
   providers: [FileService,imageKitProvider],
   exports:[FileService,MulterModule],
})
export class FileModule {}
