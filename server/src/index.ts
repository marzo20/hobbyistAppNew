// server/src/index.ts

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); 

console.log('--- Raw Process.env after dotenv.config() ---');
console.log(process.env.TWILIO_ACCOUNT_SID);
console.log(process.env.JWT_SECRET);
console.log('-------------------------------------------');

console.log('--- Environment Variables Check ---');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? 'Set' : 'Not Set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not Set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set');
console.log('--- End Environment Variables Check ---');

import express from 'express';
import cors from 'cors';
import twilioRoutes from './routes/twilioRoutes';
import userRoutes from './routes/userRoutes';
import hobbyRoutes from './routes/hobbyRoutes';
import activityRoutes from './routes/activityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import chatRoutes from './routes/chatRoutes';
import connectDB from './config/db';
import { seedActivities } from './utils/seedData';

connectDB();
seedActivities(); 

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ⭐⭐⭐ 중요: 모든 API 라우터를 '/' 라우터보다 먼저 마운트합니다. ⭐⭐⭐
app.use('/api/twilio', twilioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hobbies', hobbyRoutes); 
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hobbies', chatRoutes); 
app.use('/api/chat', chatRoutes); 


// ⭐⭐⭐ '/' 기본 라우터를 모든 API 라우터 뒤에 둡니다. ⭐⭐⭐
app.get('/', (req, res) => {
    res.send('HobbyistApp Server is running!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
