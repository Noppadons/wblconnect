import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';

@Injectable()
export class UploadService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('SUPABASE_URL or SUPABASE_KEY is not defined. File uploads will fail in production.');
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        const fileName = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

        const { data, error } = await this.supabase.storage
            .from('uploads')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('--- Supabase Upload Error Details ---');
            console.error('Error Code:', (error as any).code);
            console.error('Error Message:', error.message);
            console.error('Error Status:', (error as any).status);
            console.error('Full Error:', JSON.stringify(error, null, 2));
            console.error('--------------------------------------');

            throw new InternalServerErrorException(`ไม่สามารถอัปโหลดไฟล์ไปยัง Cloud Storage ได้: ${error.message}`);
        }

        // Get Public URL
        const { data: { publicUrl } } = this.supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return publicUrl;
    }
}
