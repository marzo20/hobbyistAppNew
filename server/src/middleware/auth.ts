// server/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Request 객체에 user 속성을 추가하기 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phoneNumber: string;
      };
    }
  }
}

// JWT Secret 환경 변수 가져오기
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables. JWT middleware cannot be initialized.');
}

// 인증 미들웨어
const auth = (req: Request, res: Response, next: NextFunction) => {
  // 1. 요청 헤더에서 토큰 가져오기
  // 헤더는 "Bearer <TOKEN>" 형식으로 옵니다.
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: '인증 토큰이 없습니다. 접근이 거부되었습니다.' });
  }

  // "Bearer " 부분을 제외하고 실제 토큰만 추출
  const token = authHeader.split(' ')[1]; // "Bearer" 다음의 문자열

  if (!token) {
    return res.status(401).json({ message: '토큰 형식이 올바르지 않습니다. 접근이 거부되었습니다.' });
  }

  try {
    // 2. 토큰 검증
    const decoded = jwt.verify(token, jwtSecret) as { id: string; phoneNumber: string };

    // 3. Request 객체에 사용자 정보 추가
    // 이제 라우트 핸들러에서 req.user로 접근 가능
    req.user = decoded;
    next(); // 다음 미들웨어 또는 라우트 핸들러로 제어 전달
  } catch (error) {
    console.error('JWT 검증 오류:', error);
    res.status(401).json({ message: '유효하지 않은 토큰입니다. 접근이 거부되었습니다.' });
  }
};

export default auth;
