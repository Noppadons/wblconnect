import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('SUPABASE_URL or SUPABASE_KEY is not defined. File uploads will fail in production.');
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        // Check for missing or placeholder keys
        if (!supabaseUrl || !supabaseKey || supabaseKey.includes('placeholder')) {
            throw new InternalServerErrorException(
                'ระบบอัปโหลดไฟล์ยังไม่ได้ถูกตั้งค่าคีย์ Supabase ที่ถูกต้อง (Invalid or missing Supabase Keys in .env). กรุณาเปลี่ยนค่า placeholders ในไฟล์ .env เป็นคีย์จริงจาก Supabase Dashboard ก่อนใช้งานครับ',
            );
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        const fileName = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

        // Fallback to application/octet-stream only for text/plain or missing mimetype to bypass Supabase restrictions
        const contentType = (file.mimetype === 'text/plain' || !file.mimetype)
            ? 'application/octet-stream'
            : file.mimetype;

        const { data, error } = await this.supabase.storage
            .from('uploads')
            .upload(fileName, file.buffer, {
                contentType: contentType,
                upsert: false,
            });

        if (error) {
            this.logger.error(`Supabase upload failed: ${error.message}`, JSON.stringify({
                code: (error as unknown as Record<string, unknown>).code,
                status: (error as unknown as Record<string, unknown>).status,
                fileName,
            }));

            // Map specific Supabase error "Invalid Compact JWS" to a clearer message
            if (error.message.includes('Invalid Compact JWS')) {
                throw new InternalServerErrorException(
                    'คีย์ Supabase ในไฟล์ .env ไม่ถูกต้อง (Invalid JWT format). กรุณาตรวจสอบว่าคีย์ที่คัดลอกมาถูกต้องครบถ้วนและไม่มีช่องว่างครับ',
                );
            }

            throw new InternalServerErrorException(`ไม่สามารถอัปโหลดไฟล์ไปยัง Cloud Storage ได้: ${error.message}`);
        }

        // Get Public URL
        const { data: { publicUrl } } = this.supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return publicUrl;
    }
}
