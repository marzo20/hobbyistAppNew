// server/src/routes/userRoutes.ts

import { Router, Request, Response } from 'express';
import auth from '../middleware/auth'; // ⭐ 인증 미들웨어 임포트
import User from '../models/User'; // ⭐ User 모델 임포트

const router = Router();

// ⭐ 보호된 라우트 예시: 사용자 자신의 프로필 정보 가져오기ㅁ
// 이 라우트에 접근하려면 유효한 JWT 토큰이 필요합니다.
// GET /api/users/me - Get current user's profile
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      // This case should theoretically not be hit if auth middleware is working
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find the user by the ID from the token, and select only the fields to send back
    const user = await User.findById(req.user.id).select(
      '_id phoneNumber nickname profilePicture interests bio joinedHobbies'
    );

    if (!user) {
      // This happens if the user was deleted but the token is still valid
      return res.status(404).json({ message: 'User not found' });
    }

    // The frontend expects the user object nested inside a 'user' key
    res.json({ user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// PATCH /api/users/me - Update the current user's profile
router.patch('/me', auth, async (req: Request, res: Response) => {
  try {
    // The user's ID comes from the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get the fields to update from the request body
    const { nickname, profilePicture, bio, interests } = req.body;

    // Find the user in the database
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the fields if they were provided in the request
    if (nickname) user.nickname = nickname;
    if (profilePicture) user.profilePicture = profilePicture;
    if (bio) user.bio = bio;
    if (interests) user.interests = interests;

    // Save the updated user document
    const updatedUser = await user.save();

    // Send back the updated user info
    res.json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});
// GET /api/users/me/hobbies - Get hobbies the current user has joined
router.get('/me/hobbies', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id)
      .populate({
        path: 'joinedHobbies',
        // Populate the creator field inside each hobby
        populate: {
          path: 'creator',
          select: 'nickname profilePicture'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.joinedHobbies);

  } catch (error) {
    console.error('Error fetching user\'s hobbies:', error);
    res.status(500).json({ message: 'Server error while fetching hobbies' });
  }
});

// GET /api/users/me/hobbies - Get hobbies the current user has joined
router.get('/me/hobbies', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id)
      .populate({
        path: 'joinedHobbies',
        model: 'Hobby', // Explicitly specify the model name
        // Optionally populate the creator within each hobby
        populate: {
          path: 'creator',
          model: 'User',
          select: 'nickname profilePicture'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.joinedHobbies);

  } catch (error) {
    console.error("Error fetching user's hobbies:", error);
    res.status(500).json({ message: "Server error while fetching hobbies" });
  }
});

export default router;
