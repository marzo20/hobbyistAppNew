import { Router, Request, Response } from 'express';
import Hobby, { IHobby } from '../models/Hobby';
import User, { IUser } from '../models/User';
import ActivityPost from '../models/ActivityPost';
import auth from '../middleware/auth';

const router = Router();
// ... (declare global block)

// --- ALL GET ROUTES REMAIN THE SAME ---

// GET /api/hobbies - All Hobbies
router.get('/', async (req: Request, res: Response) => {
  try {
    const hobbies = await Hobby.find({})
      .populate('creator', 'nickname profilePicture')
      .sort({ createdAt: -1 }); 
    res.json(hobbies);
  } catch (error: any) {
    res.status(500).json({ message: '모든 동호회/클래스를 가져오는 데 실패했습니다.' });
  }
});

// GET /api/hobbies/recommended - Recommended Hobbies
router.get('/recommended', async (req: Request, res: Response) => {
  try {
    const recommendedHobbies = await Hobby.find({})
      .populate('creator', 'nickname profilePicture')
      .limit(4);
    res.json(recommendedHobbies);
  } catch (error: any) {
    res.status(500).json({ message: '추천 동호회/클래스를 가져오는 데 실패했습니다.' });
  }
});

// GET /api/hobbies/nearby - Nearby Hobbies
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) {
      const limitedHobbies = await Hobby.find({}).populate('creator', 'nickname profilePicture').limit(2);
      return res.json(limitedHobbies);
    }
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const maxDistance = parseFloat(radius as string) || 5000;
    const nearbyHobbies = await Hobby.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistance,
        },
      },
    }).populate('creator', 'nickname profilePicture');
    res.json(nearbyHobbies);
  } catch (error: any) {
    res.status(500).json({ message: '주변 동호회/클래스를 가져오는 데 실패했습니다.' });
  }
});

// GET /api/hobbies/:id - Hobby Details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hobby = await Hobby.findById(id).populate('creator', 'nickname profilePicture');
    if (!hobby) {
      return res.status(404).json({ message: '동호회/클래스를 찾을 수 없습니다.' });
    }
    res.json(hobby);
  } catch (error: any) {
    res.status(500).json({ message: '동호회/클래스 상세 정보를 가져오는 데 실패했습니다.' });
  }
});

// GET /api/hobbies/:id/activities - Hobby Activities
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const { id: hobbyId } = req.params;
    const activities = await ActivityPost.find({ hobbyId: hobbyId })
      .populate('author', 'nickname profilePicture')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: '동호회 활동 게시물을 가져오는 데 실패했습니다.' });
  }
});

// GET /api/hobbies/:id/members - Hobby Members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id: hobbyId } = req.params;
    const members = await User.find({ joinedHobbies: hobbyId }).select('_id nickname profilePicture');
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ message: '동호회 멤버 목록을 가져오는 데 실패했습니다.' });
  }
});

// POST /api/hobbies - 새로운 동호회/클래스 생성
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증된 사용자만 동호회를 생성할 수 있습니다.' });
    }
    const { name, category, description, imageUrl, location } = req.body;
    
    const newHobby = new Hobby({ 
      name, category, description, imageUrl, location,
      creator: req.user.id,
      members: 1,
    });
    await newHobby.save();

    const creatorUser = await User.findById(req.user.id).exec();
    if (creatorUser) {
      // ✨ FINAL FIX: 이제 newHobby._id의 타입이 명확하여 에러가 발생하지 않습니다.
      creatorUser.joinedHobbies?.push(newHobby._id);
      await creatorUser.save();
    }

    res.status(201).json(newHobby);
  } catch (error: any) {
    console.error('Error creating hobby:', error);
    res.status(500).json({ message: '동호회/클래스 생성에 실패했습니다.' });
  }
});

// POST /api/hobbies/:id/join - 동호회 참여하기 API
router.post('/:id/join', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증된 사용자 정보가 없습니다.' });
    }

    const { id: hobbyId } = req.params;
    const userId = req.user.id;

    const [hobby, user] = await Promise.all([
      Hobby.findById(hobbyId).exec(),
      User.findById(userId).exec()
    ]);
    
    if (!hobby || !user) {
      return res.status(404).json({ message: '동호회 또는 사용자를 찾을 수 없습니다.' });
    }
    
    // ✨ FINAL FIX: 이제 모든 타입이 명확하므로 복잡한 캐스팅 없이도 코드가 정상 동작합니다.
    const alreadyJoined = user.joinedHobbies?.map(id => id.toString()).includes(hobby._id.toString());

    if (alreadyJoined) {
      return res.status(400).json({ message: '이미 참여하고 있는 동호회/클래스입니다.' });
    }

    user.joinedHobbies?.push(hobby._id);
    await user.save(); 

    hobby.members = (hobby.members || 0) + 1;
    await hobby.save();

    res.status(200).json({ message: '동호회/클래스 참여 성공!' });
  } catch (error: any) {
    console.error(`Error joining hobby ${req.params.id} for user ${req.user?.id}: ` , error);
    res.status(500).json({ message: '동호회/클래스 참여에 실패했습니다.' });
  }
});


export default router;