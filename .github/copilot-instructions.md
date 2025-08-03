<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# May I Correct? - 영어 튜터링 시스템

이 프로젝트는 한국어 학습자들이 영어 회화를 연습할 수 있도록 도와주는 튜터링 시스템입니다.

## 프로젝트 구조
- `frontend/`: React + Vite + TypeScript 프론트엔드
- `backend/`: Node.js + Express + TypeScript 백엔드

## 개발 가이드라인

### 코딩 스타일
- TypeScript를 사용하여 타입 안정성을 보장합니다
- 컴포넌트는 함수형 컴포넌트로 작성합니다
- CSS는 모듈화하여 각 컴포넌트별로 분리합니다
- API 응답은 일관된 인터페이스를 사용합니다

### 기능 요구사항
- 한국어 문장과 영어 번역을 입력받습니다
- 자연스러운 영어 표현으로 교정합니다
- 문법적 개선사항을 설명합니다
- 새로운 어휘와 관용표현을 제공합니다
- 문장을 카테고리별로 분류합니다

### API 설계
- RESTful API 구조를 따릅니다
- 적절한 HTTP 상태 코드를 사용합니다
- 에러 처리를 포함합니다
- CORS를 설정합니다

### UI/UX 가이드라인
- 반응형 디자인을 구현합니다
- 직관적이고 사용하기 쉬운 인터페이스를 제공합니다
- 로딩 상태를 표시합니다
- 접근성을 고려합니다
