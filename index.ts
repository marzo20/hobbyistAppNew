// index.ts
import { registerRootComponent } from 'expo';
import App from './src/App'; // <--- App.tsx가 루트에 있다면 './App'으로 유지

// 만약 App.tsx를 src/App.tsx로 옮겼고, index.ts가 루트에 있다면
// import App from './src/App'; // <-- 이렇게 경로를 수정해야 합니다.

// ⭐ 현재 프로젝트 구조상 App.tsx가 루트에 있을 가능성이 높으므로, './App'이 맞습니다.
// ⭐ 만약 나중에 src/App.tsx로 App.tsx를 옮겼다면 위에 주석 처리된 라인처럼 변경하세요.

registerRootComponent(App);