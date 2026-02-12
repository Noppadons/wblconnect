import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LineService {
    private readonly CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    private readonly CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
    private readonly LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';
    private readonly LINE_BROADCAST_API_URL = 'https://api.line.me/v2/bot/message/broadcast';

    async broadcastMessage(message: string) {
        try {
            await axios.post(
                this.LINE_BROADCAST_API_URL,
                {
                    messages: [
                        {
                            type: 'text',
                            text: message
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.CHANNEL_ACCESS_TOKEN}`
                    }
                }
            );
            console.log(`[LineService] Broadcast message sent: ${message}`);
        } catch (err: any) {
            console.error('Failed to send Line Broadcast:', err.response?.data || err.message);
            throw err;
        }
    }

    async sendMessage(to: string, message: string) {
        if (!to) return;

        // Sanitize 'to' (remove spaces)
        const recipient = to.trim();
        if (!recipient) return;

        try {
            const response = await axios.post(
                this.LINE_MESSAGING_API_URL,
                {
                    to: recipient,
                    messages: [
                        {
                            type: 'text',
                            text: message
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.CHANNEL_ACCESS_TOKEN}`
                    }
                }
            );
            console.log(`[LineService] Message sent to ${recipient}. Response:`, response.data);
        } catch (err: any) {
            console.error('Failed to send Line Message:', err.response?.data || err.message);
            // Re-throw to let the controller know it failed
            throw err;
        }
    }

    async sendAttendanceAlert(to: string, studentName: string, status: string, date: Date) {
        const dateStr = date.toLocaleDateString('th-TH');
        const message = `🔔 แจ้งเตือนการมาเรียน\nนักเรียน: ${studentName}\nสถานะ: ${status}\nวันที่: ${dateStr}`;
        return this.sendMessage(to, message);
    }
}
