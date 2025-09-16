import { Router, Request, Response } from 'express';
import ActivityPost from '../models/ActivityPost';
import auth  from '../middleware/auth';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const activities = await ActivityPost.find({})
      .populate('author', 'nickname profilePicture') 
      .sort({ createdAt: -1 });
res.json(activities); 
  } catch (error) {
    console.error('API: Failed to fetch activities:', error);
    res.status(500).json({ message: 'Failed to fetch activities.' });
  }
});

router.post('/', auth, async (req: Request, res: Response) => {
  const { content, imageUrl, hobbyId } = req.body;
  const userId = (req as any).user.id;

  if (!content && !imageUrl) {
    return res.status(400).json({ message: 'Content or image is required.' });
  }

  try {
    const newPost = await ActivityPost.create({
      userId,
      content,
      imageUrl,
      hobbyId,
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('API: Failed to create activity post:', error);
    res.status(500).json({ message: 'Failed to create activity post.' });
  }
});

router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const myPosts = await ActivityPost.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'nickname profilePicture');

    res.json(myPosts);
  } catch (error) {
    console.error('Error fetching user\'s posts:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});


// You might have a general activity feed route here as well
router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const activities = await ActivityPost.find({})
            .populate('author', 'nickname profilePicture')
            .sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch activity feed' });
    }
});

// GET /api/activities/me - Get posts created by the current user
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const myPosts = await ActivityPost.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'nickname profilePicture');

    res.json(myPosts);
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});


// This route gets all activities for the main feed
router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const activities = await ActivityPost.find({})
            .populate('author', 'nickname profilePicture')
            .sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch activity feed' });
    }
});
// POST /api/activities/:hobbyId - Create a new activity post in a specific hobby
router.post('/:hobbyId', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { hobbyId } = req.params;
    const { content, imageUrl } = req.body; // imageUrl is optional

    if (!content) {
      return res.status(400).json({ message: 'Content is required.' });
    }

    // Check if the hobby exists
    const hobby = await Hobby.findById(hobbyId);
    if (!hobby) {
      return res.status(404).json({ message: 'Hobby not found.' });
    }
    
    const newPost = new ActivityPost({
      hobbyId,
      content,
      imageUrl: imageUrl || '', // Use provided imageUrl or empty string
      author: req.user.id,
    });

    await newPost.save();

    // Populate the author info before sending the response
    const populatedPost = await newPost.populate('author', 'nickname profilePicture');

    res.status(201).json(populatedPost);

  } catch (error) {
    console.error("Error creating activity post:", error);
    res.status(500).json({ message: 'Server error while creating post.' });
  }
});


export default router;
