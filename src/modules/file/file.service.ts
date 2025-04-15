import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { File } from '@prisma/client';
import { CosService } from './cos.service';

@Injectable()
export class FileService {
  constructor(
    private prisma: PrismaService,
    private cosService: CosService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string): Promise<File> {
    // Generate a unique key for the file in COS
    const fileKey = `uploads/${Date.now()}-${file.originalname}`;

    // Upload to COS
    const fileUrl = await this.cosService.uploadFile(file, fileKey);

    // Create file record in database
    const createdFile = await this.prisma.file.create({
      data: {
        fileName: file.originalname,
        fileType: file.mimetype.split('/')[1],
        fileUrl: fileUrl,
        fileSize: file.size,
        fileKey: fileKey,
        mimeType: file.mimetype,
        createdBy: userId,
      },
    });

    return createdFile;
  }

  async getFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const buffer = await this.cosService.getFile(file.fileKey);
    return {
      buffer,
      mimeType: file.mimeType,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return;
    }

    const fileKey = file.fileUrl.split('/').pop();
    if (fileKey) {
      await this.cosService.deleteFile(fileKey);
    }
    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }

  async getFiles(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { createdBy: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({
        where: { createdBy: userId },
      }),
    ]);

    return {
      data: files,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
