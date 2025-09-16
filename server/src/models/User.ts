import mongoose, { Schema, Document, Types } from 'mongoose';

// ✨ FIX: Add the missing 'bio' and 'interests' properties.
export interface IUser extends Document {
  _id: Types.ObjectId;
  phoneNumber: string;
  nickname?: string;
  profilePicture?: string;
  bio?: string; // This was missing
  interests?: string[]; // This was missing
  joinedHobbies?: Types.ObjectId[];
}

const UserSchema: Schema<IUser> = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  nickname: { type: String },
  profilePicture: { type: String },
  bio: { type: String }, // ✨ FIX: Add field to the schema
  interests: [{ type: String }], // ✨ FIX: Add field to the schema
  joinedHobbies: [{
    type: Schema.Types.ObjectId,
    ref: 'Hobby',
  }],
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);