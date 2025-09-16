
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

// twilioService.ts

import twilio from 'twilio';

// 환경 변수들을 변수에 할당합니다.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// ⭐ 중요: 환경 변수들이 제대로 설정되었는지 확인합니다.
// 만약 하나라도 설정되지 않았다면, 에러를 throw하여 애플리케이션이 시작되지 않도록 합니다.
if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Required Twilio environment variables are not set. Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID are defined in your environment or .env file.');
}

// 환경 변수가 string임을 TypeScript에 명시하기 위해 Type Assertion을 사용합니다.
// 위의 if 문을 통해 undefined가 아님이 보장되므로 안전하게 사용할 수 있습니다.
const client = twilio(accountSid as string, authToken as string);

export const sendVerificationCode = async (to: string) => {
    try {
        // verifyServiceSid가 string임이 보장되었으므로, 이제 안전하게 사용할 수 있습니다.
        const verification = await client.verify.v2.services(verifyServiceSid as string)
                                                .verifications
                                                .create({ to: to, channel: 'sms' });
        return verification;
    } catch (error) {
        console.error('Error sending verification code:', error);
        throw error;
    }
};

export const checkVerificationCode = async (to: string, code: string) => {
    try {
        // verifyServiceSid가 string임이 보장되었으므로, 이제 안전하게 사용할 수 있습니다.
        const verificationCheck = await client.verify.v2.services(verifyServiceSid as string)
                                                     .verificationChecks
                                                     .create({ to: to, code: code });
        return verificationCheck;
    } catch (error) {
        console.error('Error checking verification code:', error);
        throw error;
    }
};