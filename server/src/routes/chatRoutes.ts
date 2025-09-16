import { Router, Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage';
import auth from '../middleware/auth';
// This assumes you are using the global module augmentation from our previous fix.
// If you still have the AuthenticatedRequest import, that's okay too.

const router = Router();

// GET /api/chat/:hobbyId/messages - Fetch all messages for a hobby
// This is the function you need to update.
router.get('/:hobbyId/messages', auth, async (req: Request, res: Response) => {
  try {
    const { hobbyId } = req.params;

    // ✨ 1. Use .populate() to get the sender's info (nickname and profilePicture)
    const messages = await ChatMessage.find({ hobbyId })
      .sort({ createdAt: 'asc' })
      .populate('sender', 'nickname profilePicture');

    // After populating, the 'messages' array now looks like this:
    // [
    //   {
    //     _id: '...',
    //     content: 'Hello world!',
    //     sender: { _id: '...', nickname: 'John', profilePicture: 'url...' }
    //   },
    //   ...
    // ]

    // ✨ 2. Simply send the populated messages directly.
    // The old .map() function is no longer needed because the data is already in the correct structure.
    res.json(messages);

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Failed to fetch chat messages.' });
  }
});


// POST /api/chat/:hobbyId/messages - Create a new message
router.post('/:hobbyId/messages', auth, async (req: Request, res: Response) => {
  try {
    const { hobbyId } = req.params;
    const { content } = req.body;

    // The user's info comes from the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const newMessage = new ChatMessage({
      hobbyId,
      content,
      sender: req.user.id, // ✨ Use the new 'sender' field
    });

    await newMessage.save();

    // For real-time updates, you would typically emit this message via WebSockets here.
    // For now, let's populate the sender info for the response.
    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate('sender', 'nickname profilePicture');

    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ message: 'Failed to create chat message.' });
  }
});


export default router;