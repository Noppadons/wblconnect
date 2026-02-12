import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class LineService {
    private readonly CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    private readonly CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
    private readonly LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';
    private readonly LINE_NOTIFY_API_URL = 'https://notify-api.line.me/api/notify';
    private readonly LINE_BROADCAST_API_URL = 'https://api.line.me/v2/bot/message/broadcast';

    async broadcastMessage(message: string) {
        if (!this.CHANNEL_ACCESS_TOKEN) {
            console.warn('[LineService] Missing LINE_CHANNEL_ACCESS_TOKEN, skipping broadcast.');
            return;
        }
        try {
            await axios.post(
                this.LINE_BROADCAST_API_URL,
                {
                    messages: [{ type: 'text', text: message }]
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
            const errorMsg = err.response?.data?.message || err.message;
            console.error('Failed to send Line Broadcast:', errorMsg);
            throw new Error(`Line Broadcast Error: ${errorMsg}`);
        }
    }

    async sendMessage(to: string, message: string) {
        if (!to) return;
        const recipient = to.trim();
        if (!recipient) return;

        // Determine if this is a LINE Notify Token or Messaging API User ID
        // Messaging API IDs usually start with 'U' and are 33 characters long
        // LINE Notify tokens are typically 43 characters long and have a different format
        const isMessagingApi = recipient.startsWith('U') && recipient.length === 33;

        if (isMessagingApi) {
            await this.sendMessagingApiMessage(recipient, message);
        } else {
            // Assume it's a LINE Notify Token
            await this.sendNotifyMessage(recipient, message);
        }
    }

    private async sendMessagingApiMessage(to: string, message: string) {
        if (!this.CHANNEL_ACCESS_TOKEN) {
            throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN for Messaging API');
        }
        try {
            await axios.post(
                this.LINE_MESSAGING_API_URL,
                {
                    to,
                    messages: [{ type: 'text', text: message }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.CHANNEL_ACCESS_TOKEN}`
                    }
                }
            );
            console.log(`[LineService] Messaging API: Message sent to ${to}`);
        } catch (err: any) {
            const errorMsg = JSON.stringify(err.response?.data) || err.message;
            console.error('Line Messaging API Error:', errorMsg);
            throw new Error(`LINE Messaging API Error: ${errorMsg}`);
        }
    }

    private async sendNotifyMessage(token: string, message: string) {
        try {
            const params = new URLSearchParams();
            params.append('message', message);

            await axios.post(
                this.LINE_NOTIFY_API_URL,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log(`[LineService] LINE Notify: Message sent successfully`);
        } catch (err: any) {
            const errorMsg = JSON.stringify(err.response?.data) || err.message;
            console.error('LINE Notify Error:', errorMsg);
            throw new Error(`LINE Notify Error: ${errorMsg}`);
        }
    }

    async sendAttendanceAlert(to: string, studentName: string, status: string, date: Date) {
        const dateStr = date.toLocaleDateString('th-TH');
        const message = `🔔 แจ้งเตือนการมาเรียน\nนักเรียน: ${studentName}\nสถานะ: ${status}\nวันที่: ${dateStr}`;
        return this.sendMessage(to, message);
    }

    verifySignature(signature: string, rawBody: string): boolean {
        if (!this.CHANNEL_SECRET) return false;

        const hash = crypto
            .createHmac('sha256', this.CHANNEL_SECRET)
            .update(rawBody)
            .digest('base64');

        return hash === signature;
    }
}
