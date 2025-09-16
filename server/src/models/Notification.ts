// server/src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose';

// 알림 데이터의 타입 정의
interface INotification extends Document {
  userId: mongoose.Schema.Types.ObjectId; // 알림을 받을 사용자 ID
  type: 'newMessage' | 'activityUpdate' | 'joinRequest' | 'system'; // 알림 타입
  message: string; // 알림 내용 (번역 키가 아닌 실제 메시지)
  messageKey?: string; // i18n 번역을 위한 키 (프론트엔드에서 사용)
  messageParams?: { [key: string]: any }; // i18n 보간을 위한 파라미터
  read: boolean; // 읽음 상태
  relatedEntityId?: mongoose.Schema.Types.ObjectId; // 관련 엔티티 (게시물, 동호회, 사용자 등) ID
  relatedEntityType?: 'ActivityPost' | 'Hobby' | 'User' | 'Message'; // 관련 엔티티 타입
  avatarUrl?: string; // 알림과 관련된 사용자/동호회 아바타 URL
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // 알림을 받을 사용자 ID
    type: { type: String, enum: ['newMessage', 'activityUpdate', 'joinRequest', 'system'], required: true },
    message: { type: String, required: true }, // 번역된 메시지 또는 기본 메시지
    messageKey: { type: String }, // 프론트엔드에서 번역을 위해 사용할 키
    messageParams: { type: Schema.Types.Mixed }, // 유연한 파라미터 저장
    read: { type: Boolean, default: false }, // 기본값은 읽지 않음
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedEntityType' }, // 다형적 참조
    relatedEntityType: { type: String, enum: ['ActivityPost', 'Hobby', 'User', 'Message'] },
    avatarUrl: { type: String },
  },
  {
    timestamps: true, // createdAt, updatedAt 필드를 자동으로 생성
  }
);

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
