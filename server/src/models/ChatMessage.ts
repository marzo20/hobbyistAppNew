import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // We need the User interface

// This interface defines what a ChatMessage document looks like
export interface IChatMessage extends Document {
  hobbyId: mongoose.Schema.Types.ObjectId;
  sender: IUser['_id'] | IUser; // ✨ It can be an ID or a populated User object
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// This is the Mongoose schema that enforces the structure
const ChatMessageSchema: Schema = new Schema({
  hobbyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hobby', 
    required: true 
  },
  // 👇 Replaced senderId, senderName, senderAvatar with this single field
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // It refers to a document in the 'User' collection
    required: true,
  },
  content: { 
    type: String, 
    required: true 
  },
}, { 
  timestamps: true // This automatically adds createdAt and updatedAt fields
});

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);