// server/routes/twilioRoutes.ts

import { Router, Request, Response } from 'express';
import { sendVerificationCode, checkVerificationCode } from '../../twilioService';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

// 인증 코드 전송 요청을 처리하는 엔드포인트
router.post('/send-code', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: '전화번호는 필수입니다.' });
  }
  try {
    const result = await sendVerificationCode(phoneNumber);
    res.json({ status: result.status });
  } catch (error: any) {
    console.error('API: 인증 코드 전송 실패:', error);
    res.status(500).json({ error: error.message || '인증 코드 전송에 실패했습니다.' });
  }
});

// 인증 코드 확인 요청을 처리하는 엔드포인트
router.post('/verify-code', async (req: Request, res: Response) => {
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: '전화번호와 코드는 필수입니다.' });
  }
  try {
    const result = await checkVerificationCode(phoneNumber, code);

    // ⭐⭐⭐ 디버깅: Twilio 인증 결과 상세 로그 ⭐⭐⭐
    console.log('--- Twilio Verification Result ---');
    console.log('Full result object:', JSON.stringify(result, null, 2)); // 전체 결과 객체
    console.log('Verification status (from Twilio):', result.status); // Twilio에서 받은 상태
    console.log('Is code valid (from Twilio):', result.valid); // 'valid' 속성도 확인 (approved와 함께 true)
    console.log('--- End Twilio Verification Result ---');


    if (result.status === 'approved') {
      console.log('Verification APPROVED. Proceeding to user lookup/creation and JWT generation.'); // ⭐ 인증 승인 확인 로그
      let user = await User.findOne({ phoneNumber });

      if (!user) {
        user = await User.create({ phoneNumber });
        console.log(`새로운 사용자 생성: ${phoneNumber}, ID: ${user._id}`);
      } else {
        console.log(`기존 사용자 로그인: ${phoneNumber}, ID: ${user._id}`);
      }

      // JWT 생성
      const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, jwtSecret, {
        expiresIn: '7d', // 토큰 만료 기간 설정 (예: 7일)
      });

      console.log('Generated JWT Token:', token); // ⭐ 생성된 JWT 토큰 출력
      console.log('Type of token:', typeof token);
      console.log('Sending JSON response (with token):', { success: true, message: '인증 성공!', token: token }); // ⭐ 최종 응답 내용 출력

      res.json({ success: true, message: '인증 성공!', token: token });
    } else {
      console.log('Verification FAILED or PENDING. Status was NOT "approved".'); // ⭐ 인증 실패/대기 확인 로그
      res.status(400).json({ success: false, message: result.status || '인증 코드가 올바르지 않습니다.' });
    }
  } catch (error: any) {
    console.error('API: 인증 코드 확인 실패:', error);
    // JWT_SECRET 로드 문제일 수도 있으니 추가 확인 로그
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET is NOT set, cannot generate token!');
    }
    res.status(500).json({ error: error.message || '인증 코드 확인에 실패했습니다.' });
  }
});

export default router;
