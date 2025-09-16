// types/express.d.ts

import { Request } from 'express';

// auth 미들웨어를 통해 req 객체에 추가될 user 정보의 타입을 정의합니다.
interface AuthUser {
  id: string;
  phoneNumber: string;
  // 여기에 JWT 토큰에 포함된 다른 사용자 정보가 있다면 추가할 수 있습니다.
  // 예: nickname?: string;
}

// 기존 Express의 Request 인터페이스를 확장하여 user 속성을 추가합니다.
// 이 타입을 사용하면 req.user 접근 시 TypeScript가 타입을 인식하게 됩니다.
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}