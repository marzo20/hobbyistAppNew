import mongoose from 'mongoose';
import Hobby from '../models/Hobby';
import ActivityPost from '../models/ActivityPost';
import User from '../models/User';
import Notification from '../models/Notification';
import ChatMessage from '../models/ChatMessage'; // ChatMessage 모델 임포트

// 이 데이터 정의는 그대로 둡니다.
const seedHobbiesData = [
  {
    name: '사진 동호회',
    category: 'Photography',
    description: '풍경, 인물, 스냅 등 다양한 사진을 함께 찍고 공유하는 모임입니다.',
    members: 15,
    location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
    imageUrl: 'https://picsum.photos/id/1001/300/200',
  },
  {
    name: '등산 모임',
    category: 'Outdoor',
    description: 'LA 근교 및 주변 산을 함께 등반하는 건강한 모임입니다.',
    members: 20,
    location: { type: 'Point', coordinates: [-118.3417, 34.1184] },
    imageUrl: 'https://picsum.photos/id/1002/300/200',
  },
  {
    name: '그림 그리기 클래스',
    category: 'Art',
    description: '초보자도 쉽게 배울 수 있는 유화, 수채화 클래스입니다.',
    members: 10,
    location: { type: 'Point', coordinates: [127.0580, 37.5000] },
    imageUrl: 'https://picsum.photos/id/1003/300/200',
  },
  {
    name: '요리 워크숍',
    category: 'Cooking',
    description: '매주 새로운 레시피로 즐겁게 요리하고 맛보는 시간입니다.',
    members: 12,
    location: { type: 'Point', coordinates: [-118.3256, 34.0928] },
    imageUrl: 'https://picsum.photos/id/1004/300/200',
  },
  {
    name: '요가 세션',
    category: 'Fitness',
    description: '몸과 마음을 수련하는 요가 세션입니다. 초보자 환영!',
    members: 8,
    location: { type: 'Point', coordinates: [-118.4912, 34.0195] },
    imageUrl: 'https://picsum.photos/id/1005/300/200',
  },
];

export const seedActivities = async () => {
  try {
    // 1. 모든 데이터 삭제
    await ActivityPost.deleteMany({});
    await Hobby.deleteMany({});
    await Notification.deleteMany({});
    await ChatMessage.deleteMany({});
    await User.deleteMany({});
    console.log('Database cleared.');

    // 👇 순서 변경: 사용자를 가장 먼저 생성합니다.
    // 2. 임시 사용자 생성
    const testPhoneNumber = '+12138004466';
    const userForPosts = await User.create({
        phoneNumber: testPhoneNumber,
        nickname: '하비스트_테스터',
        profilePicture: 'https://picsum.photos/id/1062/150/150',
        interests: ['Photography', 'Cooking', 'Hiking'],
        bio: '취미를 사랑하는 하비스트입니다! 함께 즐거운 활동해요.',
    });
    console.log(`시드용 테스트 사용자 생성: ${userForPosts.phoneNumber}`);

    // 👇 기존 동호회 데이터에 creator ID를 추가하여 새로운 배열 생성
    // 3. 동호회 시드 데이터 삽입
    const hobbiesWithCreator = seedHobbiesData.map(hobby => ({
      ...hobby,
      creator: userForPosts._id, // ✨ creator 필드 추가
    }));

    const createdHobbies = await Hobby.insertMany(hobbiesWithCreator);
    console.log('Hobbies seeded!');


    // 👇 author 필드를 사용하도록 구조 변경
    // 4. 활동 게시물 시드 데이터 삽입
    const activityPostsData = [
      {
        author: userForPosts._id, // ✨ author 필드로 변경 (userId, userName, avatarUrl 제거)
        content: `"${createdHobbies[0].name}"에서 즐거운 출사! 날씨도 좋고 사진도 잘 나왔네요.`,
        imageUrl: 'https://picsum.photos/id/200/600/400',
        hobbyId: createdHobbies[0]._id,
      },
      {
        author: userForPosts._id, // ✨ author 필드로 변경
        content: `"${createdHobbies[1].name}"와 함께 북한산 정복! 정상에서 바라본 풍경은 최고네요.`,
        imageUrl: 'https://picsum.photos/id/201/600/400',
        hobbyId: createdHobbies[1]._id,
      },
      {
        author: userForPosts._id, // ✨ author 필드로 변경
        content: `"${createdHobbies[2].name}"에서 그린 첫 유화 작품! 아직 미숙하지만 뿌듯합니다.`,
        imageUrl: 'https://picsum.photos/id/202/600/400',
        hobbyId: createdHobbies[2]._id,
      },
    ];

    const createdActivityPosts = await ActivityPost.insertMany(activityPostsData);
    console.log('Activity Posts seeded!');

    const seededNotifications = [
      {
        userId: userForPosts._id,
        type: 'activityUpdate',
        message: `${userForPosts.nickname}님이 새로운 활동을 게시했습니다.`,
        messageKey: 'notificationMessageNewPost',
        messageParams: { userName: userForPosts.nickname },
        read: false,
        avatarUrl: userForPosts.profilePicture,
        relatedEntityId: createdActivityPosts[0]._id,
        relatedEntityType: 'ActivityPost',
      },
      {
        userId: userForPosts._id,
        type: 'joinRequest',
        message: `새로운 사용자 ${userForPosts.nickname}님이 ${createdHobbies[0].name}에 가입 요청을 보냈습니다.`,
        messageKey: 'notificationMessageJoinRequest',
        messageParams: { userName: '새로운 사용자', hobbyName: createdHobbies[0].name },
        read: false,
        avatarUrl: 'https://picsum.photos/id/1000/40/40',
        relatedEntityId: createdHobbies[0]._id,
        relatedEntityType: 'Hobby',
      },
      {
        userId: userForPosts._id,
        type: 'system',
        message: '하비스트에 오신 것을 환영합니다! 새로운 취미를 탐색해 보세요.',
        messageKey: 'notificationMessageSystem',
        read: true,
      },
    ];

    await Notification.insertMany(seededNotifications);
    console.log('Notifications seeded!');

    // 👇 sender 필드를 사용하도록 구조 변경 (ChatMessage 모델 스키마도 변경 권장)
    // 6. 채팅 메시지 시드 데이터 삽입
    const seededChatMessages = [
      {
        hobbyId: createdHobbies[0]._id, // 사진 동호회 채팅방
        sender: userForPosts._id, // ✨ sender 필드로 변경 (senderId, senderName, senderAvatar 제거)
        content: '안녕하세요, 사진 동호회 여러분! 첫 출사 기대됩니다!',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        hobbyId: createdHobbies[0]._id, // 사진 동호회 채팅방
        sender: userForPosts._id, // ✨ sender 필드로 변경
        content: '이번 주말 날씨가 좋다고 하네요. 다들 준비되셨나요?',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        hobbyId: createdHobbies[1]._id, // 등산 모임 채팅방
        sender: userForPosts._id, // ✨ sender 필드로 변경
        content: '등산 모임 멤버 구합니다! 초보자도 환영이에요!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    await ChatMessage.insertMany(seededChatMessages);
    console.log('Chat Messages seeded!');

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};