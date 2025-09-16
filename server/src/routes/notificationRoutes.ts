// server/src/routes/notificationRoutes.ts

import { Router, Request, Response } from 'express';
import auth from '../middleware/auth'; // 인증 미들웨어 임포트
import Notification from '../models/Notification'; // Notification 모델 임포트
import User from '../models/User'; // User 모델 임포트 (필요시 사용자 정보 가져오기)

const router = Router();

// Request 객체에 user 속성을 추가하기 위한 타입 확장 (auth.ts에도 있지만, 라우트 파일에서도 필요)
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

// GET /api/notifications - 로그인한 사용자의 모든 알림 목록 가져오기
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증된 사용자 정보가 없습니다.' });
    }

    // req.user.id (JWT 페이로드의 사용자 _id)를 사용하여 해당 사용자의 알림만 가져옵니다.
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }); // 최신 알림이 먼저 오도록 정렬

    res.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications for user:', req.user?.id, error);
    res.status(500).json({ message: '알림을 가져오는 데 실패했습니다.' });
  }
});

// PUT /api/notifications/:id/read - 특정 알림을 읽음 상태로 업데이트
router.put('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증된 사용자 정보가 없습니다.' });
    }

    const { id } = req.params; // URL 파라미터에서 알림 ID 가져오기

    // 알림을 찾고, 해당 알림이 요청한 사용자의 것인지 확인합니다.
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id }, // 알림 ID와 사용자 ID 모두 일치해야 함
      { read: true }, // read 상태를 true로 변경
      { new: true } // 업데이트된 문서를 반환
    );

    if (!notification) {
      // 알림을 찾을 수 없거나, 해당 사용자의 알림이 아닌 경우
      return res.status(404).json({ message: '알림을 찾을 수 없거나 권한이 없습니다.' });
    }

    res.json({ message: '알림이 읽음 처리되었습니다.', notification });
  } catch (error: any) {
    console.error('Error marking notification as read:', req.user?.id, error);
    res.status(500).json({ message: '알림을 읽음 처리하는 데 실패했습니다.' });
  }
});

export default router;
