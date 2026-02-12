import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

@Controller('upload')
export class UploadController {
    @Post('image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname).toLowerCase();
                    callback(null, `img-${uniqueSuffix}${ext}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, callback) => {
                const ext = extname(file.originalname).toLowerCase();
                if (ALLOWED_EXTENSIONS.includes(ext)) {
                    callback(null, true);
                } else {
                    callback(new BadRequestException('รองรับเฉพาะไฟล์ JPG, PNG, GIF, WebP'), false);
                }
            },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('กรุณาเลือกไฟล์รูปภาพ');
        }
        return {
            url: `/uploads/${file.filename}`,
            originalName: file.originalname,
            size: file.size,
        };
    }
}
