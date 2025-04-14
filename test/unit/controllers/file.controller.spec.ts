/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '@/modules/file/file.controller';
import { FileService } from '@/modules/file/file.service';
import { Response } from 'express';

describe('FileController', () => {
  let controller: FileController;

  const mockFileService = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockUser = {
    id: '1',
    phone: '13800138000',
    name: 'Test User',
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashed_password',
    avatar: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      };

      const mockUploadedFile = {
        id: '1',
        fileName: mockFile.originalname,
        fileType: 'pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: mockFile.size,
        fileKey: 'uploads/test.pdf',
        mimeType: mockFile.mimetype,
        createdBy: mockUser.id,
      };

      mockFileService.uploadFile.mockResolvedValue(mockUploadedFile);

      const result = await controller.uploadFile(mockFile as any, mockUser);

      expect(result).toEqual(mockUploadedFile);
      expect(mockFileService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        mockUser.id,
      );
    });
  });

  describe('getFile', () => {
    it('should get a file successfully', async () => {
      const fileId = '1';
      const mockFile = {
        buffer: Buffer.from('test content'),
        mimeType: 'application/pdf',
      };

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockFileService.getFile.mockResolvedValue(mockFile);

      await controller.getFile(fileId, mockResponse);

      expect(mockFileService.getFile).toHaveBeenCalledWith(fileId);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        mockFile.mimeType,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockFile.buffer);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const fileId = '1';

      mockFileService.deleteFile.mockResolvedValue(undefined);

      const result = await controller.deleteFile(fileId);

      expect(result).toEqual({ message: '文件删除成功' });
      expect(mockFileService.deleteFile).toHaveBeenCalledWith(fileId);
    });
  });
});
