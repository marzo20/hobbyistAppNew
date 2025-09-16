import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import auth from '../middleware/auth';

const router = Router();

// Configure Multer to store files in memory as buffers
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload/image - Image upload endpoint
router.post('/image', auth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    // This check correctly handles the logic if a file is missing.
    if (!req.file) {
      return res.status(400).json({ message: '이미지 파일이 제공되지 않았습니다.' });
    }

    // The rest of the code runs only if req.file exists.
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "hobbyist_profile_pictures",
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
      // ✨ FIX: Add '!' to assert that req.file is not undefined here.
      uploadStream.end(req.file!.buffer);
    });

    const result = uploadResult as { secure_url: string };

    res.status(200).json({ 
      message: '이미지 업로드 성공!', 
      imageUrl: result.secure_url 
    });

  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    res.status(500).json({ message: '이미지 업로드 중 서버 오류가 발생했습니다.' });
  }
});

export default router;