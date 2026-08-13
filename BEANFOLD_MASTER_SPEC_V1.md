# BEANFOLD — Product / UX / Design / Development Master Spec

> 문서 목적: Codex가 BEANFOLD 모바일 앱을 실제 실행 가능한 MVP 수준까지 구현하기 위한 통합 기획·IA·기능·디자인·개발 명세서  
> 브랜드명: **BEANFOLD**  
> 핵심 문장: **Know it. Brew it. Remember it.**  
> 기본 UI 폰트: **SUIT**  
> 기본 원칙: Pourist는 기능·문제 정의를 이해하기 위한 레퍼런스이며, BEANFOLD의 정보 구조·화면 구성·카피·브랜드·시각 시스템을 그대로 복제하지 않는다.

---

# 0. Codex 시작 지침

프로젝트를 구현할 때 다음 파일을 우선 참고한다.

- `references/BEANFOLD_LOGO_REFERENCE.png`
- `references/BEANFOLD_APP_ICON_REFERENCE.png`
- `references/BEANFOLD_APP_UI_CONCEPT_REFERENCE.png`
- `references/BEANFOLD_BRAND_IMAGE_BOARD.png`
- `references/POURIST_REFERENCE_REVERSE_PRD.md`

## Codex 작업 원칙

1. 이 문서를 최우선 제품/개발 사양서로 간주한다.
2. 프로젝트 시작 전 현재 저장소와 개발 환경을 검사한다.
3. 필요한 개발 언어, SDK, 패키지, CLI, 라이브러리, 테스트 도구, Codex skill이 없다면 **Codex가 직접 조사하고 설치 가능한 것은 설치한다.**
4. `TASKS.md`를 생성해 구현 작업을 관리한다.
5. TODO, placeholder, 빈 mock 화면만 남겨두고 완료했다고 하지 않는다.
6. 기능 구현 후 직접 실행·테스트하고 오류를 수정한다.
7. 실제 외부 credential이 없을 때는 기능 전체를 멈추지 말고 adapter / local mode / fake provider로 격리한다.
8. OpenAI API 또는 기타 비밀키를 모바일 앱 번들에 포함하지 않는다.
9. 핵심 기능은 가능한 한 **Local-first / Offline-first / Free-tier friendly**하게 구현한다.
10. Pourist의 화면 배치, 4탭 구조, Guide/Custom UI, 브루잉 컬러 연출 등을 그대로 복제하지 않는다.
11. 레퍼런스 이미지에서 브랜드 로고/아이콘의 **형태적 기준은 유지**하되, 래스터 이미지를 단순 확대해 UI에 붙이는 방식보다 실제 앱용 벡터/고해상도 에셋으로 정리한다.
12. 불명확한 부분은 제품 원칙과 본 문서의 우선순위를 기준으로 합리적으로 결정하되, 주요 구조를 임의로 Pourist와 동일하게 되돌리지 않는다.

---

# 1. 제품 기획서

## 1.1 제품 한 줄 정의

**처음 보는 원두는 어떻게 내려야 할지 알려주고, 마신 커피와 브루잉 경험을 기록하면서 내가 어떤 커피를 좋아하는지 알아가는 개인 커피 컴패니언이자 아카이브 앱.**

BEANFOLD는 단순한 커피 타이머, 원두 재고 앱, 레시피 생성 앱이 아니다.

핵심 루프는 다음과 같다.

`Know → Brew → Record → Compare → Discover`

- **Know**: 이 원두는 무엇인지 이해한다.
- **Brew**: 이 원두를 어떻게 내릴지 시작점을 얻는다.
- **Record**: 실제로 마신 한 잔과 추출 조건을 기록한다.
- **Compare**: 같은 원두, 같은 장비, 다른 변수의 결과를 비교한다.
- **Discover**: 반복 기록을 통해 자신의 취향을 발견한다.

## 1.2 해결할 핵심 사용자 질문

### 질문 A — 이 원두가 뭐지?
사용자가 원두 라벨, 이름 검색, 직접 입력을 통해 다음 정보를 확인한다.

- 국가
- 산지 / 지역
- 농장 / 워싱스테이션
- 품종
- 가공 방식
- 고도
- 로스터
- 로스팅 날짜
- 로스팅 레벨
- 테이스팅 노트
- 설명
- 패키지 이미지

### 질문 B — 이 원두는 어떻게 내려야 하지?
초보자는 Guided 방식으로 검증된 시작 레시피를 추천받는다.

- 원두량
- 물양
- 비율
- 온도
- 분쇄도
- 뜸
- 푸어 횟수
- 예상 추출 시간
- 드리퍼 / 필터 / 물의 영향을 고려한 보정

### 질문 C — 나는 어떤 커피를 좋아하지?
Cup 기록이 쌓이면 다음과 같은 개인화 인사이트를 제공한다.

- 좋아하는 산지
- 좋아하는 가공법
- 좋아하는 로스팅 범위
- 선호 향미
- 같은 원두에서 만족도가 높았던 조건
- 최근 취향의 변화
- 반복적으로 높은 점수를 준 조합

## 1.3 주요 타깃

### 초보
- 핸드드립을 시작했지만 어떤 레시피가 맞는지 모르는 사용자
- 원두 패키지의 정보가 어렵게 느껴지는 사용자
- 장비를 샀지만 분쇄도, 비율, 온도 설정이 막막한 사용자

### 중급
- 여러 원두와 장비를 사용하며 결과를 기록하고 싶은 사용자
- 같은 원두를 다른 조건으로 비교하고 싶은 사용자
- 유튜브 / 바리스타 / 로스터 레시피를 저장해 쓰고 싶은 사용자

### 고급 / 전문가
- 세부 변수와 레시피를 직접 관리하고 싶은 사용자
- 자신의 데이터로 향미, 추출 변수, 장비 차이를 분석하고 싶은 사용자
- Guided보다 Manual 입력을 선호하는 사용자

## 1.4 Guided / Manual 원칙

사용자를 “초보 / 전문가”로 고정 분류하지 않는다. 같은 사용자도 원두에 따라 두 경험을 오갈 수 있다.

### Guided
- 최소 입력
- 시작점 추천
- 친절한 설명
- 단계별 브루잉 도움
- 기본 피드백

### Manual
- 상세 변수 직접 수정
- 사용자 레시피 생성 / 복제
- 세부 장비 / 물 / 푸어 구조
- 고급 피드백
- 비교 분석

둘의 결과는 모두 같은 `Cup Record`로 저장한다.

---

# 2. 핵심 도메인 모델

## 2.1 Bean

사용자가 보유하거나 경험한 원두.

예시:

- Ethiopia
- Guji
- Uraga
- 74110
- Washed
- Light Roast
- Jasmine / Peach / Bergamot

## 2.2 Bean Lot

동일한 제품을 재구매해도 새 로트로 등록한다.

필수 또는 권장 필드:

- id
- user_id
- product_id optional
- roaster
- product_name
- roast_date
- roast_level
- initial_weight_g
- remaining_weight_g
- storage_type
- state: opened / unopened / frozen / finished / archived
- image_uri
- created_at

## 2.3 Cup

실제로 사용자가 마신 한 잔.

`Cup`은 Home Brew와 Cafe를 동일한 경험 단위로 묶는다.

### Home Brew Cup
- bean_lot
- recipe snapshot
- grinder
- dripper
- filter
- water
- dose
- water
- ratio
- temperature
- grind
- brew time
- feedback
- memo
- photo

### Cafe Cup
- cafe
- bean info
- drink
- brew method optional
- tasting notes
- satisfaction
- memo
- photo

## 2.4 Recipe

- type: base / guided / manual / imported
- owner
- hot_ice
- name
- source
- dose
- water
- ratio
- temperature
- grind target
- equipment
- total time
- steps
- version
- created_at

## 2.5 Brew Session

실행 시점의 Recipe snapshot을 저장한다.

- started_at
- paused_at
- completed_at
- status
- step state
- actual values
- recipe_snapshot

## 2.6 Taste / Feedback

기본 피드백:

- Not for me
- Good
- Loved it

향미 선택:

- Floral
- Fruity
- Juicy
- Sweet
- Clean
- Creamy
- Nutty
- Roasty
- Funky

고급 피드백:

- acidity
- sweetness
- body
- bitterness
- aftertaste
- balance
- aroma
- memo

---

# 3. IA 구조

## 3.1 메인 내비게이션

BEANFOLD 기본 IA는 **4영역 + 전역 Add Action**으로 구성한다.

### 1. Home
오늘 마실 원두와 가장 빠른 행동.

### 2. Journal
모든 Cup 기록.

### 3. Collection
내가 경험한 커피 자산.

### 4. Profile
Taste Profile, 설정, 계정.

### 중앙 Add Action
`+`

- Add Bean
- Record Cup
- Home Brew
- Cafe Cup

## 3.2 IA 트리

```text
BEANFOLD
├─ Home
│  ├─ Today's Bean
│  ├─ Brew Now
│  ├─ Recent Cups
│  ├─ My Beans preview
│  ├─ Taste Lately
│  └─ Recommendations / Insight
│
├─ Journal
│  ├─ Timeline
│  ├─ Filters
│  │  ├─ All
│  │  ├─ Home Brew
│  │  └─ Cafe
│  ├─ Compare
│  └─ Cup Detail
│
├─ Collection
│  ├─ Beans
│  │  ├─ Bean Library
│  │  ├─ Bean Detail
│  │  └─ Add Bean
│  ├─ Recipes
│  │  ├─ Guided
│  │  └─ My Recipes
│  ├─ Gear
│  │  ├─ Grinder
│  │  ├─ Dripper
│  │  ├─ Filter
│  │  ├─ Kettle
│  │  ├─ Scale
│  │  └─ Water
│  └─ Cafes
│
├─ Profile
│  ├─ Taste Profile
│  ├─ Statistics
│  ├─ Account
│  ├─ Notifications
│  ├─ Units
│  ├─ Language
│  ├─ Appearance
│  ├─ Data / Backup
│  └─ Legal
│
└─ Global Add
   ├─ Add Bean
   ├─ Record Cup
   ├─ Start Home Brew
   └─ Record Cafe Cup
```

---

# 4. 핵심 사용자 플로우

## 4.1 첫 원두 등록 → Guided Brew

```text
Onboarding
→ Home
→ Add Bean
→ Camera / Gallery / Search / Manual
→ OCR or Search Match
→ Bean Info Confirm
→ Save Bean Lot
→ Bean Detail
→ Brew
→ Guided
→ Select owned equipment
→ Recipe starting point
→ Brew Timer
→ Complete
→ Record Cup
→ Feedback
→ Journal / Bean Detail updated
```

## 4.2 Manual Brew

```text
Bean Detail
→ Brew
→ My Way / Manual
→ Existing Recipe or New Recipe
→ Edit variables
→ Save optional
→ Start Brew
→ Complete
→ Cup Record
→ Advanced Feedback optional
```

## 4.3 Cafe Cup

```text
Global Add
→ Record Cafe Cup
→ Photo / Cafe optional
→ Bean / Drink info
→ Impression
→ Notes
→ Save
→ Journal
```

## 4.4 Compare

```text
Bean Detail
→ My Cups
→ Select 2 or more Cups
→ Compare
→ Variables + Taste + Score
→ User insight
```

---

# 5. 기능 명세서

## 5.1 P0 — MVP

### Authentication
- 비회원 local start
- Apple / Google / Email은 cloud backup 시점에 제공 가능
- 로그인 전에도 핵심 기능 사용 가능

### Bean
- 수동 등록
- 검색
- 수정 / 보관 / 삭제
- Bean Lot 관리
- 남은 용량
- 상태 관리
- 이미지

### Coffee Knowledge DB
- Country
- Region
- Variety
- Process
- Flavor Note
- Roast Level

### Gear
- 내 장비 등록
- 주요 Equipment Catalog
- 대표 장비 지정
- custom gear fallback

### Recipe
- Base Recipe
- Guided Recipe
- Manual Recipe CRUD
- Recipe Step editor
- 실행 시 snapshot

### Recipe Engine
생성형 AI가 수치를 자유 생성하지 않는다.

```text
Base Recipe
→ Roast Adjustment
→ Process Adjustment
→ Dripper Adjustment
→ Filter / Water Adjustment
→ Grinder Adjustment
→ User History Adjustment
→ Validation
```

초기에는 Rule Engine으로 구현한다.

### Brewing
- countdown
- current step
- elapsed / remaining time
- current pour
- cumulative water
- pause
- resume
- skip
- finish
- background restore
- local haptic / sound / notification
- interrupted session recovery

### Cup Record
- Home / Cafe
- satisfaction
- flavor tags
- memo
- photo optional
- recipe / brew snapshot

### Journal
- Timeline
- Home / Cafe filter
- Bean filter
- Cup Detail

### Compare
- 같은 Bean의 2개 이상 Cup 비교
- 주요 변수 비교
- taste / score 비교
- 차이 하이라이트

### Taste Profile v1
AI 없이 계산 가능한 통계 기반.

- flavor preferences
- origin preferences
- process preferences
- roast preferences
- average rating
- recent trend
- basic text insight templates

### Local Notification
- delayed feedback optional
- bean low inventory
- roast / resting reminder optional

### Offline
핵심 기능 전부 오프라인 사용 가능.

## 5.2 P1

- On-device OCR
- fuzzy bean matching
- advanced Taste Profile
- photo cloud backup
- cafe record refinement
- cafe map
- recipe share
- import from URL / screenshot
- widgets / Live Activity
- advanced statistics

## 5.3 P2

- community verified bean catalog
- community recipe sharing
- roastery partnerships
- smart scale / kettle connection
- personalized recommendation model
- advanced AI explanation layer
- Watch support

---

# 6. 초기 DB 전략

## 6.1 Local seed first

앱 번들에 SQLite seed DB 포함.

초기 목표:

| 데이터 | 목표 |
|---|---:|
| Coffee Countries | ~30 |
| Major Regions | 150–300 |
| Varieties | 100–150 |
| Processes | 20–30 |
| Flavor Vocabulary | 150–300 |
| Grinders | 50–100 |
| Drippers | 30–50 |
| Filters | 20–40 |
| Water Profiles | 10–30 |
| Base Recipes | 20–40 |
| Adjustment Rules | ~100 |

## 6.2 데이터 신뢰도

각 catalog entity에 다음 필드를 고려한다.

- verification_status
- source_type
- source_url
- verified_at
- confidence

예:

- verified
- community
- user
- inferred
- unverified

## 6.3 Canonical과 User Data 분리

```text
EquipmentCatalog
→ UserEquipment

CoffeeProduct
→ BeanLot
→ Cup

BaseRecipe
→ UserRecipe
→ BrewSession
```

Master data 변경이 과거 사용자 기록을 망가뜨리지 않도록 snapshot 전략을 사용한다.

---

# 7. 무료 구현 우선 기술 구조

## 7.1 기본 원칙

- Local-first
- Offline-first
- Free-tier friendly
- 서버가 없어도 핵심 앱 동작
- 필요할 때만 Supabase sync
- 생성형 AI는 MVP 필수 아님

## 7.2 권장 기술 스택

Codex는 저장소와 현재 환경을 먼저 검사한 후 아래를 기본안으로 검토한다. 더 나은 현재 선택지가 있으면 호환성과 유지보수성을 근거로 교체 가능하다.

### App
- React Native
- Expo
- TypeScript
- Expo Router

### Local Data
- expo-sqlite
- local asset seed DB
- image files local storage

### Cloud
- Supabase Free
  - Auth
  - Postgres
  - Storage
  - Edge Functions only when needed
  - RLS

### Client State
- TanStack Query
- Zustand 또는 동일 목적의 경량 store

### OCR
가능하면 on-device.

- Google ML Kit Text Recognition
- iOS Vision 가능 시 adapter 구성

### Camera / Photo
- Expo Camera
- Expo ImagePicker

### Notifications
- Expo Notifications
- local notifications 우선

### Analytics / Crash
필요 시 무료 티어 범위에서:

- Firebase Analytics
- Firebase Crashlytics
- 또는 현재 더 단순한 대안

### Testing
- unit test
- component test
- end-to-end / smoke test
- lint / typecheck
- CI 가능 시 GitHub Actions

## 7.3 Codex 설치 지침

**개발언어와 개발도구, 필요한 skill 및 dependency는 Codex가 프로젝트 환경을 검사한 뒤 직접 선택·설치한다.**

Codex는 다음을 수행해야 한다.

1. Node / package manager 확인
2. Expo / React Native 환경 확인
3. iOS / Android 개발 환경 확인
4. 필요한 npm package 설치
5. 필요 시 Supabase CLI 설치
6. lint / formatter / test 환경 설치
7. 이미지 / SVG / icon 처리 도구 설치
8. 필요한 Codex skill이 설치 가능하면 설치
9. 프로젝트에 불필요한 대규모 dependency는 추가하지 않음
10. 설치 결과 및 버전은 README 또는 `ENVIRONMENT.md`에 기록

---

# 8. OCR / 자동완성 무료 전략

```text
Camera
→ On-device OCR
→ Normalize text
→ Dictionary / Alias match
→ Coffee Knowledge DB match
→ Confidence
→ User confirmation
```

처음부터 LLM Vision API를 필수로 사용하지 않는다.

Parser 예시:

```text
ETHIOPIA → country
GUJI → region
URAGA → subregion
74110 → variety
WASHED → process
JASMINE → flavor
PEACH → flavor
```

검색되지 않은 항목은 사용자가 직접 확인 / 수정 가능해야 한다.

---

# 9. Recipe Engine v1

## 입력

- Bean
- roast level
- roast date / age
- process
- dose target
- dripper
- filter
- grinder
- water
- user history optional

## 처리

1. compatible base recipe 선택
2. roast 보정
3. bean age / bloom 보정
4. dripper / filter flow 보정
5. grinder target 변환
6. water / ratio 보수적 보정
7. 사용자 과거 기록 보정
8. safety / range validation
9. explanation template 생성

## 출력

- dose
- water
- ratio
- temperature
- grind target
- steps
- expected total time
- reason notes

동일 입력 + 동일 rule version은 재현 가능해야 한다.

---

# 10. Taste Profile v1

초기에는 머신러닝 없이 구현한다.

예:

```text
Average rating by:
- origin
- region
- process
- roast
- flavor
- dripper
- recipe
```

텍스트 템플릿 예:

- “최근에는 Floral 계열의 커피에 높은 평가를 남겼어요.”
- “Washed Ethiopia에서 평균 만족도가 높아요.”
- “이 원두는 90–91℃에서 더 좋은 평가를 기록했어요.”

충분한 데이터가 없으면 과도한 결론을 내리지 않는다.

---

# 11. 디자인 시스템

## 11.1 Brand Personality

- Warm
- Refined
- Thoughtful
- Modern
- Organized
- Personal

BEANFOLD는 **커피 전문 도구의 정확함 + 개인 아카이브의 따뜻함** 사이에 있어야 한다.

## 11.2 Brand Copy

Primary:

**Know it. Brew it. Remember it.**

보조 방향:

- Every cup, folded into memory.
- Brew with intention.
- Remember every good cup.

## 11.3 Logo

레퍼런스:

`references/BEANFOLD_LOGO_REFERENCE.png`

핵심 원칙:

- B + Fold 조형
- 접혀 올라가는 면
- 단순 커피콩 / 컵 / 드리퍼를 추가하지 않는다.
- 로고 레퍼런스의 형태를 임의로 크게 바꾸지 않는다.
- 실제 앱용 최종 에셋은 SVG 또는 충분히 선명한 벡터 기반으로 정리한다.

## 11.4 App Icon

레퍼런스:

`references/BEANFOLD_APP_ICON_REFERENCE.png`

현재 앱 아이콘은 브랜드 메인 심볼과 다른 **전용 반전 구조**를 가진다.

- rounded dark espresso square
- cream B form
- 중앙의 fold cut
- 작은 사이즈에서도 B가 분명해야 함

임의로 메인 로고 심볼을 단순히 사각형 안에 집어넣어 대체하지 않는다.

---

# 12. Color System

## Brand

| Token | HEX | 용도 |
|---|---|---|
| Espresso | `#3B2E26` | Primary |
| Cream | `#F6F2EB` | Main background |
| Warm Beige | `#E7DCCA` | Secondary surface |
| Soft Gold | `#C6A15A` | Accent |
| Charcoal | `#333333` | Text |

## Extended Neutral

```text
Neutral 950  #211B18
Neutral 800  #403833
Neutral 600  #756C66
Neutral 400  #A99F98
Neutral 200  #DDD5CD
Neutral 100  #EEE8E1

Surface Cream #F6F2EB
Surface Warm  #E7DCCA
Surface White #FCFAF7
```

### 사용 비율 가이드

- Cream / White: 70%
- Espresso / Charcoal: 20%
- Warm Beige: 7%
- Soft Gold: 3%

Soft Gold는 장식 남용 금지.

---

# 13. Typography — SUIT

**앱 UI 기본 폰트는 SUIT로 고정한다.**

Codex는 SUIT의 라이선스와 적절한 배포 방식을 확인하고 프로젝트에 정상 적용한다.

권장 타입 스케일:

| Token | Size | Weight | 용도 |
|---|---:|---:|---|
| Display | 32 | 600 | 큰 제목 |
| Title 1 | 28 | 600 | Screen title |
| Title 2 | 22 | 600 | Section |
| Title 3 | 18 | 600 | Card title |
| Body Large | 17 | 400 | 강조 본문 |
| Body | 15 | 400 | 기본 본문 |
| Label | 14 | 500 | UI label |
| Caption | 12 | 400 | 보조 정보 |
| Micro | 11 | 500 | metadata |

Brew 핵심 숫자:

- 600–700
- 충분한 시각적 우선순위
- Dynamic Type / accessibility 대응

---

# 14. Spacing / Grid

```text
Screen horizontal padding 20
Compact gap 8
Small gap 12
Default gap 16
Section gap 24
Large section gap 32

Small card padding 12
Default card padding 16
Feature card padding 20
```

카드로 화면을 과도하게 채우지 않는다.

---

# 15. Radius

```text
Radius XS 6
Radius S 10
Radius M 14
Radius L 18
Radius XL 24
Radius Full 999
```

Pill은 filter / flavor chip / segmented control 등에 제한한다.

---

# 16. Buttons

## Primary
- Espresso background
- Cream text
- Radius M or L

## Secondary
- transparent / cream
- Espresso border

## Tertiary
- text action
- 최소 장식

## Accent
Soft Gold는 다음 용도에 제한:

- Recommended
- Loved
- selected accent
- special insight

---

# 17. Cards

## Bean Card
- image
- bean name
- origin
- process / roast
- flavors
- state

## Cup Card
- date
- bean
- method
- core brew values
- satisfaction / score

## Recipe Card
- dose
- water
- ratio
- temp
- dripper
- difficulty / source

## Insight Card
- 문장 중심
- 작은 데이터 보조

---

# 18. Chips / Flavor Tags

기본:

- Warm Beige / Cream
- Charcoal text
- full radius

Selected:

- Espresso
- Cream

Flavor마다 강한 별도 색을 부여하지 않는다.

---

# 19. Iconography

- 단순 line icon
- 약 1.5–2px stroke
- geometric하지만 너무 테크스럽지 않음
- 브랜드 Fold 효과를 모든 UI icon에 반복하지 않음

필요 icon:

- Home
- Journal
- Collection
- Profile
- Bean
- Recipe
- Brew
- Gear
- Camera
- Taste
- Bookmark
- Compare
- Filter
- Settings

---

# 20. Photography

## 권장

- natural light
- muted warm neutral
- real coffee packaging
- bean details
- handwritten notes
- ceramic
- paper
- matte metal
- wood
- stone
- daily ritual

## 피함

- 과도한 vintage filter
- cliché stock coffee
- 강한 orange cast
- 과도한 gold luxury
- 과한 film grain

“광고 사진”보다 “개인의 커피 생활 기록” 같은 느낌.

---

# 21. Motion

Fold를 브랜드 motion language로 제한적으로 사용한다.

예:

- save → fold-in
- detail open → unfold / reveal
- splash → one surface gently folds

과한 종이 3D 애니메이션은 피한다.

권장 duration:

- micro: 150–220ms
- standard: 220–350ms

---

# 22. Brand Voice

Tone:

- Calm
- Clear
- Curious
- Helpful
- Never intimidating

예:

나쁜 방식:
> 최적 추출을 위해 분쇄도를 조정하세요.

권장:
> 지난 잔은 조금 빠르게 추출됐어요. 이번에는 한 단계 곱게 시작해볼까요?

나쁜 방식:
> 사용자의 취향을 분석했습니다.

권장:
> 최근에는 Floral한 Washed 커피를 자주 좋아했어요.

---

# 23. 화면별 디자인 성격

### Home — Today
빠른 시작 + 최근 맥락.

### Bean Detail — Knowledge
원두 이해.

### Brew — Focus
불필요한 장식 제거.

### Journal — Memory
시간과 경험.

### Compare — Learning
차이를 이해.

### Taste Profile — Discovery
취향을 발견.

---

# 24. 접근성

- 핵심 텍스트 WCAG AA 대비 목표
- Dynamic Type 대응
- 핵심 Brew 숫자 truncation 금지
- VoiceOver label 제공
- 색만으로 상태 구분하지 않음
- 최소 touch target 고려
- reduce motion 대응

---

# 25. 예외 / 실패 상태

반드시 구현:

- camera denied
- gallery denied
- OCR no result
- bean search no result
- gear search no result
- offline
- sync conflict
- brew interrupted
- low bean inventory
- invalid recipe totals
- missing equipment
- cloud unavailable

모든 실패 상태는 Manual fallback을 제공한다.

---

# 26. 데이터 / 보안

- 사용자 Cup / memo 기본 private
- Supabase RLS
- 삭제 / 탈퇴 처리
- 사진 metadata 최소화
- local-first 데이터 백업 정책
- catalog와 user content 구분
- external AI 사용 시 명시적 동의
- secret key client bundle 금지

---

# 27. 분석 이벤트

최소 이벤트:

```text
bean_add_started
bean_add_completed
bean_search
bean_ocr_used
bean_ocr_corrected

recipe_viewed
recipe_guided_created
recipe_manual_created
recipe_saved

brew_started
brew_paused
brew_resumed
brew_step_skipped
brew_completed
brew_abandoned

cup_recorded
feedback_submitted

journal_viewed
compare_started
compare_completed
taste_profile_viewed

gear_added
gear_custom_created
```

민감한 memo text는 analytics payload로 전송하지 않는다.

---

# 28. QA 핵심 시나리오

1. 비회원으로 앱 시작 가능
2. 인터넷 없이 Bean / Recipe / Brew / Cup 핵심 기능 사용
3. 앱 background 후 timer 정확 복원
4. pause 중 시간 감소 없음
5. 완료 시 Cup 한 번만 생성
6. 과거 Recipe snapshot 유지
7. Bean 수정 후 과거 Cup 불변
8. 남은 원두 자동 차감
9. OCR 실패 시 manual 입력
10. 장비 없음 시 custom 생성
11. Dynamic Type에서 Brew 화면 정상
12. 동일 input / 동일 rule version에서 Guided Recipe 재현
13. sync 재시도 시 duplicate 방지
14. 16px급 app icon / symbol 가독성 확인

---

# 29. 프로젝트 산출물

Codex는 구현하면서 최소 다음 문서를 유지한다.

```text
README.md
TASKS.md
ENVIRONMENT.md
ARCHITECTURE.md
DATA_MODEL.md
DESIGN_TOKENS.md
QA.md
```

권장 코드 구조 예:

```text
src/
├─ app/
├─ components/
├─ features/
│  ├─ beans/
│  ├─ recipes/
│  ├─ brewing/
│  ├─ cups/
│  ├─ journal/
│  ├─ taste/
│  ├─ gear/
│  └─ profile/
├─ domain/
├─ services/
├─ database/
├─ design-system/
├─ assets/
└─ utils/
```

실제 구조는 선택한 framework의 최신 모범 사례에 맞춰 Codex가 정리한다.

---

# 30. 레퍼런스 사용 규칙

## BEANFOLD Logo
`references/BEANFOLD_LOGO_REFERENCE.png`

- 형태 / fold concept 참고
- 임의 재해석 최소화

## BEANFOLD App Icon
`references/BEANFOLD_APP_ICON_REFERENCE.png`

- 현재 전용 앱 아이콘 형태를 기준으로 함
- 메인 로고 심볼과 혼동 금지

## BEANFOLD App UI Concept
`references/BEANFOLD_APP_UI_CONCEPT_REFERENCE.png`

참고할 것:
- cream / espresso palette
- quiet layout
- information hierarchy
- cards의 가벼운 사용
- bean detail / journal / compare / taste direction

복제하지 말 것:
- 생성 이미지의 오탈자
- 비현실적 데이터
- 정확하지 않은 spacing
- placeholder copy

## BEANFOLD Brand Image Board
`references/BEANFOLD_BRAND_IMAGE_BOARD.png`

참고:
- photography mood
- warm neutral palette
- paper / ceramic / tactile material
- editorial calm
- modern specialty coffee impression

## Pourist Reference
`references/POURIST_REFERENCE_REVERSE_PRD.md`

**기능 연구용 레퍼런스일 뿐 UI / 브랜드 / IA 복제 금지.**

참고 가능:
- coffee domain scope
- bean / equipment data categories
- brewing timer의 기능 요구
- feedback loop 아이디어
- offline / recovery 필요성

의도적으로 차별화:
- Home 구조
- Guide / Custom segmentation
- 4탭 역할
- generation loading show
- brewing color system
- Journey 명칭과 구조
- Pourist 고유 copy / 그래픽 / branding

---

# 31. 제품 우선순위

제품 의사결정 충돌 시 다음 순서를 따른다.

1. 사용자가 원두를 쉽게 이해할 수 있는가
2. 초보가 실제로 한 잔을 내릴 수 있는가
3. 경험자가 세부 변수를 기록할 수 있는가
4. 기록이 Cup 단위로 자연스럽게 축적되는가
5. 같은 원두를 비교할 수 있는가
6. 사용자가 자신의 취향을 더 잘 알게 되는가
7. 시각적으로 BEANFOLD 브랜드와 일관되는가
8. 무료 / 로컬 방식으로 유지 가능한가
9. 확장성이 있는가

---

# 32. MVP 완료 정의

MVP는 아래 흐름이 실제 기기 / simulator에서 끝까지 작동할 때 완료로 본다.

```text
App Launch
→ Local Start
→ Add Bean
→ Bean Detail
→ Guided Recipe
→ Brew
→ Complete
→ Record Cup
→ Journal
→ Compare
→ Taste Profile
```

추가로 Manual Recipe / Manual Brew도 end-to-end로 작동해야 한다.

빈 화면과 mock data만 보이는 상태는 완료가 아니다.

---

# 33. 이후 제품 확장 방향

BEANFOLD의 장기 데이터 자산은 단순 catalog가 아니다.

```text
User
→ Bean
→ Recipe / Brew
→ Cup
→ Taste
→ Preference
```

궁극적으로 다음을 설명할 수 있어야 한다.

> 어떤 사용자가  
> 어떤 원두를  
> 어떤 장비와 레시피로 내렸고  
> 어떤 맛을 느꼈으며  
> 얼마나 좋아했는가.

단, 처음부터 복잡한 ML을 구현하지 않는다. 충분한 사용자 데이터가 쌓인 뒤 확장한다.

---

# 34. 최종 제품 원칙

**Quiet**  
화면이 소리치지 않는다.

**Useful**  
장식보다 다음 행동이 명확하다.

**Tactile**  
차가운 데이터 도구보다 커피와 기록의 촉감이 느껴진다.

**Personal**  
대시보드가 아니라 “나의 커피 아카이브”다.

**Progressive**  
초보가 시작할 수 있고, 경험이 쌓일수록 더 깊게 사용할 수 있다.

**Reproducible**  
Guided Recipe는 설명 가능하고 재현 가능해야 한다.

**Local-first**  
네트워크가 없어도 핵심 커피 경험은 멈추지 않는다.

# 35. 가독성·접근성 최우선 원칙

BEANFOLD의 모든 화면 설계와 구현에서 **시각적 아름다움보다 가독성과 접근성을 우선한다.**

AI가 생성한 UI 시안, reference image, mood board에서 텍스트가 작거나 명도 대비가 낮더라도 그대로 복제하지 않는다. Reference는 브랜드 무드와 정보 구조를 참고하기 위한 자료이며, 실제 구현에서는 반드시 가독성과 접근성 기준에 맞게 수정한다.

제품 의사결정 우선순위:

`사용성·가독성 → 접근성 → 브랜드 일관성 → 시각적 완성도 → 정보 위계 → 장식`

BEANFOLD의 디자인은 접근성과 브랜드 완성도 중 하나를 선택하는 문제가 아니다. **두 조건을 동시에 만족해야 한다.**

### 절대 통과 조건 — Accessibility & Usability
다음 중 하나라도 실패하면 디자인 실패로 간주한다.

- 읽을 수 있는가
- 충분한 명도 대비가 있는가
- 저시력 사용자가 핵심 기능을 이용할 수 있는가
- Dynamic Type / text scaling에서 레이아웃이 무너지지 않는가
- VoiceOver / TalkBack으로 핵심 플로우를 수행할 수 있는가
- 주요 touch target이 충분한가
- 다음 행동과 상태가 명확한가

### 품질 통과 조건 — Brand & Visual Quality
접근성을 만족했다는 이유만으로 범용적이고 평범한 기본 UI로 끝내지 않는다. 다음도 반드시 만족해야 한다.

- BEANFOLD답게 보이는가
- Cream / Espresso / Warm Neutral 시스템이 일관적인가
- SUIT 타이포그래피가 정돈되어 있는가
- 여백, 비례, 리듬이 충분한가
- `Warm / Refined / Modern / Tactile / Personal` 감성이 유지되는가
- 일반적인 CRUD 앱이나 관리자 화면처럼 보이지 않는가
- AI가 흔히 생성하는 획일적인 카드 UI를 그대로 답습하지 않는가
- 실제 상용 소비자 앱 수준의 시각적 완성도가 있는가

**접근성 준수를 이유로 디자인을 평범한 기본 UI로 후퇴시키지 않는다.** 제약 안에서 BEANFOLD의 브랜드 개성과 시각적 완성도를 적극적으로 구현한다.

반대로 **브랜드 무드나 시각적 아름다움을 이유로 작은 글자, 낮은 대비, 지나치게 얇은 폰트, 불분명한 선택 상태를 허용하지 않는다.**

최종 원칙:

> **Accessible by default, unmistakably BEANFOLD.**


한국 서비스로서 관련 국내 접근성 법령·지침을 고려하고, 실무 최소 기준으로 **WCAG 2.2 Level AA**를 참고한다. 법적 적용 범위와 세부 의무는 출시 전 최신 기준을 다시 확인한다.

## 35.1 Typography / SUIT 가독성

앱 UI 기본 폰트는 **SUIT**로 고정한다.

- 본문: SUIT Regular 400 이상
- Label: SUIT Medium 500 이상
- Heading: SUIT SemiBold 600 이상
- 핵심 Brew 숫자: SUIT SemiBold/Bold 600–700
- 본문에 Thin / Light 계열 사용 금지
- 장문은 좌측 정렬 우선
- 과도한 letter spacing 금지
- 이미지 안에 핵심 텍스트를 bake-in하지 않음
- 중요 정보는 실제 텍스트 컴포넌트로 렌더링

권장 최소 크기:

```text
Body          15–17
Label         14 이상
Caption       12 이상
핵심 버튼     15 이상
브루잉 숫자   32 이상
```

11–12 크기의 텍스트는 비핵심 metadata에만 제한적으로 사용하며, 낮은 명도 대비 색상과 조합하지 않는다.

## 35.2 명도 대비

최소 WCAG 2.2 AA 수준을 목표로 한다.

- 일반 텍스트: 배경 대비 **4.5:1 이상**
- 큰 텍스트: **3:1 이상**
- 의미 있는 아이콘, 버튼 경계, 입력창 경계, focus indicator 등 주요 비텍스트 UI: 가능한 한 **3:1 이상**

Brand Color:

```text
Espresso   #3B2E26
Cream      #F6F2EB
Warm Beige #E7DCCA
Soft Gold  #C6A15A
Charcoal   #333333
```

다음 조합은 Contrast 검증 전 사용하지 않는다.

- Soft Gold text / Cream
- Warm Beige text / Cream
- Light gray text / Warm Beige
- Thin gray text / photo

Soft Gold는 주로 장식, selected indicator, icon accent에 사용하며 핵심 본문색으로 사용하지 않는다.

Secondary text도 opacity만 낮추지 말고 실제 contrast ratio를 확인한다.

## 35.3 저시력 사용자 우선 규칙

다음 핵심 정보는 작은 회색 글씨로만 제공하지 않는다.

- Bean name
- Recipe parameter
- Brew step
- 현재 시간
- 현재 물양
- 다음 행동
- 오류
- 저장 여부
- selected state

Brew 화면의 시각적 우선순위:

`현재 단계 > 남은 시간 > 현재 물양 > 다음 단계`

핵심 상태는 색만으로 구분하지 않는다. 텍스트, 아이콘, 형태 중 하나 이상을 함께 사용한다.

## 35.4 사진 위 텍스트

원두 사진 또는 패키지 이미지 위 핵심 텍스트를 직접 배치할 경우 다음 중 하나를 사용한다.

- solid surface
- 충분한 opacity의 scrim
- gradient scrim
- 별도 정보 영역

배경 이미지 밝기에 의존해 white/black만 자동 선택하는 방식으로 끝내지 않는다.

## 35.5 Dynamic Type / Text Scaling

시스템 글꼴 크기 확대를 막지 않는다.

텍스트 확대 시:

- 카드 높이 확장
- 버튼 높이 확장
- 줄바꿈
- layout reflow

가 정상 동작해야 한다.

금지:

- clipping
- 핵심 정보 ellipsis
- button label 잘림
- overlay 충돌
- 고정 높이 때문에 텍스트 소실

핵심 화면은 텍스트 **200% 확대 상황에서도 콘텐츠와 기능 손실이 없는지** QA한다.

## 35.6 색각 이상 대응

색은 정보 전달의 유일한 수단이 될 수 없다.

다음은 색 외에 텍스트, 아이콘 또는 형태를 병행한다.

- selected / unselected
- error / success
- score
- process type
- brew step
- favorite
- roast level
- chart legend

## 35.7 Touch Target

주요 모바일 UI의 실제 터치 영역은 가능하면 **44×44dp 이상**을 기본 권장값으로 한다.

특히:

- Back
- Close
- Pause
- Skip
- Complete
- Add
- Camera
- Bookmark
- Bottom Navigation

아이콘 그림 자체가 작아도 실제 touch area는 충분히 넓게 설정한다.

## 35.8 Screen Reader / Focus

모든 상호작용 요소에 의미 있는 accessibility label을 제공한다.

예:

- `브루잉 일시정지`
- `원두 추가`
- `오늘 기록 열기`
- `에티오피아 구지 원두 상세 보기`

아이콘만 있는 버튼도 이름을 가진다.

VoiceOver / TalkBack의 탐색 순서는 시각적 정보 순서와 일치해야 한다.

장식 이미지는 불필요한 접근성 label을 제공하지 않는다.

## 35.9 Brew Timer 접근성

브루잉은 시간 민감 기능이므로 특별히 엄격하게 구현한다.

항상 화면에서 확인 가능:

- 현재 단계
- 남은 시간
- 현재 푸어량
- 누적 물양
- 다음 단계

햅틱이나 소리가 꺼져 있어도 화면만으로 진행 가능해야 한다.

가능한 경우 중요한 상태 전환에 VoiceOver/TalkBack announcement를 제공한다.

예:

- `뜸들이기 시작. 30초.`
- `다음 단계. 100밀리리터 푸어.`

## 35.10 시간 제한

브루잉 자체처럼 시간성이 본질인 기능을 제외하면 사용자가 제한 시간 안에 조작해야 하는 UI를 최소화한다.

- 입력 폼
- 확인 모달
- 피드백
- 온보딩

등은 자동으로 사라지지 않는다.

중요한 정보는 toast에만 넣지 않는다.

## 35.11 Motion

Reduce Motion 설정을 존중한다.

자동 감소 또는 제거 대상:

- parallax
- large zoom
- 과한 fold animation
- 장시간 transition
- flashing

브랜드 Fold animation은 장식이며 핵심 정보 전달 수단이 아니다.

## 35.12 Form Accessibility

모든 입력에는 명시적 label을 제공한다.

Placeholder를 label 대신 사용하지 않는다.

Error는 색만 사용하지 않고:

- icon
- text
- 명확한 오류 설명

을 함께 제공한다.

예:

`총 푸어량이 목표 물양 240ml와 일치하지 않아요.`

## 35.13 AI 디자인 결과 검수

AI가 생성한 UI는 최종 구현 규격이 아니다.

Codex는 다음 AI 디자인 패턴을 그대로 구현하지 말고 수정한다.

- 작은 회색 텍스트
- 과한 letter spacing
- 얇은 font
- 저대비 label
- 사진 위 읽기 어려운 텍스트
- 작은 icon / touch target
- fixed-height text container
- 핵심 정보 ellipsis
- decorative hierarchy가 사용성을 방해하는 화면
- 비활성 상태와 보조 텍스트가 구별되지 않는 화면

Reference와 접근성 기준이 충돌하면 **접근성 기준을 우선한다.**

## 35.14 접근성 QA 필수 항목

MVP 완료 전에 최소 다음을 검증한다.

1. iOS VoiceOver
2. Android TalkBack 가능 시
3. 시스템 글꼴 크기 최대 단계
4. Display Zoom / 확대 설정
5. Light Mode contrast
6. Dark Mode 구현 시 Dark Mode contrast
7. Reduce Motion
8. 긴 한국어 Bean / Gear / Recipe 이름
9. 긴 영문 명칭
10. 색을 보지 않고도 상태 구분 가능
11. 확대 상태에서도 핵심 action 접근 가능
12. 주요 버튼 touch target
13. Brew Timer announcement
14. Form label / error
15. 빈 상태 / 오류 상태 접근성
16. 주요 화면 screenshot contrast 검토

필수 accessibility QA 화면:

- Onboarding
- Home
- Add Bean
- Bean Detail
- Guided Recipe
- Manual Recipe
- Brew Timer
- Record Cup
- Journal
- Compare
- Taste Profile
- Settings

## 35.15 접근성 완료 기준

다음 상태가 아니면 MVP 완료로 판단하지 않는다.

- SUIT 텍스트가 실제 기기에서 선명하고 읽기 쉬움
- 핵심 본문이 충분한 크기와 대비를 가짐
- AA 명도 대비 목표 충족
- 저시력 환경에서 핵심 정보 사용 가능
- Dynamic Type에서 핵심 화면이 깨지지 않음
- VoiceOver로 핵심 end-to-end flow 수행 가능
- 색 없이 상태 구분 가능
- 충분한 터치 영역 확보
- 중요한 UI가 자동으로 사라지지 않음
- 접근성 blocker는 `QA.md`에 명확히 기록

**“예쁘지만 읽기 어렵다”는 결과는 실패로 간주한다.**
