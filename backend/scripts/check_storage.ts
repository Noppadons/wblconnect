import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkStorage() {
    console.log('Checking Supabase Storage...');
    console.log('URL:', supabaseUrl);

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing URL or Key in .env');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error fetching buckets:', error.message);
        return;
    }

    console.log('Buckets found:', buckets.map(b => b.name).join(', ') || 'NONE');

    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    if (uploadsBucket) {
        console.log('✅ "uploads" bucket exists.');
        console.log('   Public:', uploadsBucket.public);
    } else {
        console.log('❌ "uploads" bucket NOT FOUND. Creating it...');
        const { data, error: createError } = await supabase.storage.createBucket('uploads', {
            public: true,
            allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            fileSizeLimit: 20 * 1024 * 1024
        });

        if (createError) {
            console.error('Failed to create bucket:', createError.message);
        } else {
            console.log('✅ Bucket "uploads" created successfully.');
        }
    }
}

checkStorage();
