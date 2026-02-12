
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const URL = 'https://api.line.me/v2/bot/message/broadcast';

async function test() {
    process.stdout.write('Testing LINE Broadcast: ' + (TOKEN ? TOKEN.substring(0, 15) + '...' : 'MISSING') + '\n');

    try {
        const res = await axios.post(URL, {
            messages: [{
                type: 'text',
                text: '🔔 ทดสอบการแจ้งเตือนจากระบบ WBL Connect (Broadcast Mode)\nขณะนี้ระบบเชื่อมต่อสำเร็จแล้วครับ!'
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        process.stdout.write('Success: Message sent to all friends!\n');
        process.stdout.write('Response: ' + JSON.stringify(res.data) + '\n');
    } catch (err) {
        process.stdout.write('Status: ' + (err.response ? err.response.status : 'NO_RESPONSE') + '\n');
        process.stdout.write('Data: ' + JSON.stringify(err.response ? err.response.data : err.message, null, 2) + '\n');
    }
}

test();
