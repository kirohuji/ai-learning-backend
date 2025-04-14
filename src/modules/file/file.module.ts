import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule } from '@nestjs/config';
import cosConfig from '@/configurations/cos.config';
import { CosService } from './cos.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { FileExceptionFilter } from './exceptions/file-exception.filter';

@Module({
  imports: [
    ConfigModule.forFeature(cosConfig),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    }),
  ],
  controllers: [FileController],
  providers: [
    FileService,
    PrismaService,
    CosService,
    {
      provide: 'APP_FILTER',
      useClass: FileExceptionFilter,
    },
  ],
  exports: [FileService],
})
export class FileModule {}
