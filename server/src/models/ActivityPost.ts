// server/src/models/ActivityPost.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IActivityPost extends Document {
  hobbyId: mongoose.Schema.Types.ObjectId;
  content: string;
  imageUrl?: string;
  author: IUser['_id'] | IUser; // ⭐️ 이 필드를 추가합니다. (또는 userId)
}

const ActivityPostSchema: Schema = new Schema({
  hobbyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hobby', 
    required: true 
  },
  content: { type: String, required: true },
  imageUrl: { type: String },
  // ⭐️ 사용자(User) 모델을 참조하도록 설정합니다.
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { timestamps: true });

export default mongoose.model<IActivityPost>('ActivityPost', ActivityPostSchema);