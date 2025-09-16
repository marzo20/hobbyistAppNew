import mongoose, { Schema, Document, Types } from 'mongoose'; // ✨ Types를 import 합니다.
import { IUser } from './User';

export interface IHobby extends Document {
  _id: Types.ObjectId; // ✨ FINAL FIX: _id 타입을 명시적으로 추가합니다.
  name: string;
  category: string;
  description: string;
  members: number;
  imageUrl?: string;
  location?: object;
  creator: IUser['_id'];
}

const HobbySchema: Schema<IHobby> = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  members: { type: Number, default: 0 },
  imageUrl: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

HobbySchema.index({ location: '2dsphere' });

export default mongoose.model<IHobby>('Hobby', HobbySchema);