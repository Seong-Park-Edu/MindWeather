# Development Build 설정 및 사용 가이드

## 📱 Development Build란?

Development Build는 Expo Go의 제한을 벗어나 모든 네이티브 기능을 사용할 수 있는 커스텀 Expo 앱입니다.

### Development Build가 필요한 이유
- ✅ NativeWind v4 사용 가능
- ✅ Push Notifications 완전 지원
- ✅ 모든 네이티브 모듈 사용 가능
- ✅ 실제 프로덕션 환경과 동일한 조건에서 테스트

---

## 🚀 빌드 방법

### 1. EAS CLI 설치 (최초 1회)

```bash
npm install -g eas-cli
```

### 2. Expo 계정 로그인

```bash
eas login
```

### 3. Android Development Build 생성

#### 로컬 빌드 (빠름, 하지만 Android Studio 필요)

```bash
cd "c:\Users\pjs93\Desktop\MindWeather\MindWeatherClient\mobile"
eas build --platform android --profile development --local
```

#### 클라우드 빌드 (느리지만 설정 불필요)

```bash
cd "c:\Users\pjs93\Desktop\MindWeather\MindWeatherClient\mobile"
eas build --platform android --profile development
```

> 💡 **팁**: 로컬 빌드는 5-10분, 클라우드 빌드는 15-20분 소요됩니다.

### 4. APK 다운로드 및 설치

- 클라우드 빌드: EAS 대시보드에서 APK 다운로드 링크를 받습니다
- 로컬 빌드: 빌드 완료 후 APK 파일이 생성됩니다

**Android 기기에 APK 설치:**
1. APK 파일을 휴대폰으로 전송
2. 파일 탐색기에서 APK 파일 실행
3. "알 수 없는 출처" 권한 허용
4. 설치 완료

---

## 🔧 개발 서버 실행

Development Build 앱을 설치한 후:

```bash
cd "c:\Users\pjs93\Desktop\MindWeather\MindWeatherClient\mobile"
npx expo start --dev-client
```

앱을 열고 Development Build 아이콘을 탭하면 개발 서버에 연결됩니다.

---

## 📦 설치된 주요 패키지

Development Build에 포함된 네이티브 모듈:
- ✅ expo-notifications (푸시 알림)
- ✅ expo-dev-client (개발 클라이언트)
- ✅ expo-location (위치 정보)
- ✅ react-native-gesture-handler (제스처)
- ✅ react-native-reanimated (애니메이션)
- ✅ NativeWind v4 (Tailwind CSS)

---

## 🐛 문제 해결

### 빌드 실패 시

```bash
# 캐시 삭제 후 재시도
rm -rf node_modules .expo android ios
npm install
eas build --platform android --profile development --clear-cache
```

### 앱 연결 안 될 때

1. 같은 WiFi 네트워크에 연결되어 있는지 확인
2. 방화벽이 Metro 포트(8081)를 차단하지 않는지 확인
3. `npx expo start --dev-client --tunnel` 시도

### Push Notification 테스트

Development Build에서는 실제 Push Token이 생성됩니다:

```bash
# 앱 로그에서 확인:
# "Expo Push Token: ExponentPushToken[...]"
```

---

## 📝 다음 단계

1. ✅ Development Build APK 생성 완료
2. ⏳ Android 기기에 APK 설치
3. ⏳ `npx expo start --dev-client` 실행
4. ⏳ 앱 열기 및 개발 서버 연결
5. ⏳ NativeWind 스타일 및 Push Notification 테스트

---

## ⚙️ 설정 파일

- **eas.json**: EAS Build 설정
- **app.json**: Expo 앱 설정 (newArchEnabled: true)
- **babel.config.js**: Babel 설정 (NativeWind v4 호환)
- **metro.config.js**: Metro 번들러 설정 (NativeWind v4)
- **tailwind.config.js**: Tailwind CSS 설정

---

## 🎯 주요 변경 사항

1. **expo-dev-client 설치 및 플러그인 추가**
2. **eas.json에 development 프로필 구성**
3. **Push Notifications 활성화** (AuthContext.tsx)
4. **NativeWind v4 완전 지원**
5. **New Architecture 활성화** (app.json)

---

## 💡 유용한 명령어

```bash
# Development Build 생성 (Android)
eas build --platform android --profile development

# Development Build 생성 (iOS, macOS만 가능)
eas build --platform ios --profile development

# Production Build 생성
eas build --platform android --profile production

# 빌드 상태 확인
eas build:list

# 개발 서버 실행
npx expo start --dev-client
```

---

**문제가 발생하면 다음을 확인하세요:**
- Node.js 버전: v18 이상 권장
- EAS CLI 버전: 최신 버전 사용
- Expo 계정: 로그인 상태 확인
