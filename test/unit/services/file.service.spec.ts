/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from '../../../src/modules/file/file.service';
import { PrismaService } from '../../../src/common/prisma/prisma.service';
import { CosService } from '../../../src/modules/file/cos.service';

describe('FileService', () => {
  let service: FileService;

  const mockPrismaService = {
    file: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCosService = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CosService,
          useValue: mockCosService,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const userId = '1';
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      };

      const fileKey = `uploads/${Date.now()}-${mockFile.originalname}`;
      const fileUrl = 'https://example.com/test.pdf';

      const mockCreatedFile = {
        id: '1',
        fileName: mockFile.originalname,
        fileType: 'pdf',
        fileUrl,
        fileSize: mockFile.size,
        fileKey,
        mimeType: mockFile.mimetype,
        createdBy: userId,
      };

      mockCosService.uploadFile.mockResolvedValue(fileUrl);
      mockPrismaService.file.create.mockResolvedValue(mockCreatedFile);

      const result = await service.uploadFile(mockFile as any, userId);

      expect(result).toEqual(mockCreatedFile);
      expect(mockCosService.uploadFile).toHaveBeenCalledWith(mockFile, fileKey);
      expect(mockPrismaService.file.create).toHaveBeenCalledWith({
        data: {
          fileName: mockFile.originalname,
          fileType: 'pdf',
          fileUrl,
          fileSize: mockFile.size,
          fileKey,
          mimeType: mockFile.mimetype,
          createdBy: userId,
        },
      });
    });
  });

  describe('getFile', () => {
    it('should get a file successfully', async () => {
      const fileId = '1';
      const mockFile = {
        fileKey: 'uploads/test.pdf',
        mimeType: 'application/pdf',
      };

      const mockBuffer = Buffer.from('test content');

      mockPrismaService.file.findUnique.mockResolvedValue(mockFile);
      mockCosService.getFile.mockResolvedValue(mockBuffer);

      const result = await service.getFile(fileId);

      expect(result).toEqual({
        buffer: mockBuffer,
        mimeType: mockFile.mimeType,
      });
      expect(mockPrismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      });
      expect(mockCosService.getFile).toHaveBeenCalledWith(mockFile.fileKey);
    });

    it('should throw error when file not found', async () => {
      const fileId = '1';

      mockPrismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.getFile(fileId)).rejects.toThrow('File not found');
    });
  });
});
