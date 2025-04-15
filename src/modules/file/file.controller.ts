import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Param,
  Res,
  UseFilters,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FileService } from './file.service';
import { CurrentUser } from '@/decorator/user.decorator';
import { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { FileExceptionFilter } from './exceptions/file-exception.filter';

@ApiTags('文件管理')
@Controller('files')
@UseGuards(AuthGuard('jwt'))
@UseFilters(FileExceptionFilter)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @ApiOperation({ summary: '获取文件列表' })
  async getFiles(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.fileService.getFiles(user.id, page, limit);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileService.uploadFile(file, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件' })
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.fileService.getFile(id);
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  async deleteFile(@Param('id') id: string) {
    await this.fileService.deleteFile(id);
    return null;
  }
}
