import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UPLOAD } from '../common/constants';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_DOC_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.zip',
  '.rar',
  ...ALLOWED_IMAGE_EXTENSIONS,
];

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
          return callback(
            new BadRequestException(
              'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP)',
            ),
            false,
          );
        }
        if (!UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
          return callback(
            new BadRequestException(
              `ประเภทไฟล์ ${file.mimetype} ไม่ได้รับอนุญาต`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('กรุณาเลือกไฟล์รูปภาพ');

    const url = await this.uploadService.uploadFile(file, 'images');

    return {
      url: url,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
          return callback(
            new BadRequestException('ขออภัย ประเภทไฟล์ไม่ได้รับอนุญาต'),
            false,
          );
        }
        if (!UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype as any)) {
          return callback(
            new BadRequestException(
              `ประเภทไฟล์ ${file.mimetype} ไม่ได้รับอนุญาต`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('กรุณาเลือกไฟล์');

    const url = await this.uploadService.uploadFile(file, 'documents');

    return {
      url: url,
      originalName: file.originalname,
      size: file.size,
      type: extname(file.originalname).slice(1),
    };
  }
}
