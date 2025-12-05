# Web README

<details open>
<summary>🇰🇷 한국어</summary>

## 📜 개요

cutty-x는 2025년 소프트뱅크 해커톤을 위해 제작된 최신 FaaS(Function as a Service) 플랫폼입니다. 재미있고 시각적인 인터페이스를 통해 서버리스 함수를 생성, 배포 및 관리할 수 있습니다.

## ✨ 주요 기능

### 시각적 함수 캔버스

-   **Draw.io 스타일 인터페이스**: 무한 캔버스 위에서 함수를 드래그, 드롭하고 배열
-   **줌 & 팬**: React Flow를 사용한 전체 탐색 제어 및 뷰포트 상태 유지
-   **노드 유형**: 함수, 텍스트 주석, 그룹화용 사각형
-   **상태 표시기**: 함수 상태(유휴, 실행 중, 오류, 미배포, 사용 불가)에 대한 시각적 피드백
-   **자동 저장**: 1초 디바운스로 작업 공간 상태를 DynamoDB에 자동 저장
-   **영구적인 작업 공간**: 캔버스 위치, 줌 레벨, 모든 노드/엣지 보존
-   **삭제 키 지원**: 선택한 노드를 Delete 또는 Backspace로 제거 (텍스트 편집 중 실수로 인한 삭제 방지)

### 함수 관리

-   **다중 런타임**: Node.js(18, 20) 및 Python(3.9, 3.10, 3.11) 지원
-   **환경 변수**: 민감한 값 마스킹 기능이 포함된 함수별 런타임 환경 구성
-   **HTTP 라우트**: 각 함수에 대한 사용자 정의 API 엔드포인트
-   **코드 에디터**: 파일 트리 탐색 기능이 있는 Monaco 에디터
-   **파일 관리**: 파일/폴더 생성, 디렉토리 구조로 코드 구성
-   **일괄 저장**: 모든 파일 변경 사항을 메모리에서 추적하고 메타데이터와 함께 한 번에 저장
-   **수정 표시기**: 에디터에서 저장되지 않은 변경 사항에 대한 시각적 피드백

### 보안 및 취약점 검사

-   **AI 기반 분석**: OpenAI 기반 코드 취약점 탐지
-   **보안 스캐닝**: 무한 루프, 파일 시스템 접근, DDoS 위험 등 검사
-   **심각도 수준**: 분류된 취약점 보고서 (낮음, 중간, 높음, 심각)

## 🚀 시작하기

### 사전 요구 사항

-   Node.js 18 이상
-   npm 또는 yarn
-   AWS 계정 (프로덕션 배포용)
-   OpenAI API 키 (선택 사항, 취약점 검사용)

### 설치

```bash
# 저장소 복제
git clone https://github.com/Softbank-Hackathon-2025-Team-Green/web.git
cd web

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env.local

# .env.local에 자격 증명 편집:
# - S3, DynamoDB, Lambda를 위한 AWS 자격 증명
# - 취약점 검사를 위한 OpenAI API 키

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)을 방문하여 플랫폼을 확인하세요.

</details>

<details>
<summary>🇯🇵 日本語</summary>

## 📜 概要

cutty-xは、2025年のソフトバンクハッカソン向けに構築された最新のFaaS（Function as a Service）プラットフォームです。楽しく視覚的なインターフェースを通じて、サーバーレス関数を作成、デプロイ、管理できます。

## ✨ 主な機能

### ビジュアル関数キャンバス

-   **Draw.io風インターフェース**: 無限のキャンバス上で関数をドラッグ、ドロップ、配置
-   **ズーム＆パン**: React Flowを使用した完全なナビゲーション制御とビューポートの永続化
-   **ノードタイプ**: 関数、テキスト注釈、グループ化用の長方形
-   **ステータスインジケーター**: 関数の状態（アイドル、実行中、エラー、未デプロイ、利用不可）に関する視覚的フィードバック
-   **自動保存**: 1秒のデバウンスでワークスペースの状態をDynamoDBに自動保存
-   **永続的なワークスペース**: キャンバスの位置、ズームレベル、すべてのノード/エッジを保持
-   **削除キーのサポート**: 選択したノードをDeleteまたはBackspaceで削除（テキスト編集中に誤って削除するのを防ぐ）

### 関数管理

-   **複数のランタイム**: Node.js（18、20）およびPython（3.9、3.10、3.11）をサポート
-   **環境変数**: 機密性の高い値のマスキング機能を備えた関数ごとのランタイム環境構成
-   **HTTPルート**: 各関数のカスタムAPIエンドポイント
-   **コードエディター**: ファイルツリーナビゲーション付きのMonacoエディター
-   **ファイル管理**: ファイル/フォルダーの作成、ディレクトリー構造によるコードの整理
-   **一括保存**: すべてのファイル変更をメモリで追跡し、メタデータと一緒に一度に保存
-   **変更インジケーター**: エディターで保存されていない変更に対する視覚的フィードバック

### セキュリティと脆弱性チェック

-   **AIベースの分析**: OpenAIベースのコード脆弱性検出
-   **セキュリティスキャン**: 無限ループ、ファイルシステムアクセス、DDoSリスクなどをチェック
-   **重大度レベル**: 分類された脆弱性レポート（低、中、高、クリティカル）

## 🚀 はじめに

### 前提条件

-   Node.js 18以降
-   npmまたはyarn
-   AWSアカウント（本番デプロイ用）
-   OpenAI APIキー（オプション、脆弱性チェック用）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Softbank-Hackathon-2025-Team-Green/web.git
cd web

# 依存関係をインストール
npm install

# 環境変数を設定
cp env.example .env.local

# .env.localに資格情報を編集：
# - S3、DynamoDB、Lambda用のAWS資格情報
# - 脆弱性チェック用のOpenAI APIキー

# 開発サーバーを実行
npm run dev
```

[http://localhost:3000](http://localhost:3000)にアクセスしてプラットフォームをご覧ください。

</details>

<details>
<summary>🇬🇧 English</summary>

## 📜 Overview

cutty-x is a modern FaaS (Function as a Service) platform built for the SoftBank Hackathon 2025. It allows you to create, deploy, and manage serverless functions with a playful, visual interface.

## ✨ Features

### Visual Function Canvas

-   **Draw.io-like Interface**: Drag, drop, and arrange functions on an infinite canvas
-   **Zoom & Pan**: Full navigation control with React Flow and viewport persistence
-   **Node Types**: Functions, text annotations, and border/grouping rectangles
-   **Status Indicators**: Visual feedback for function states (idle, running, error, not-deployed, unavailable)
-   **Auto-Save**: Workspace state automatically saved to DynamoDB with a 1-second debounce
-   **Persistent Workspace**: Canvas position, zoom level, and all nodes/edges are preserved
-   **Delete Key Support**: Remove selected nodes with Delete or Backspace (prevents accidental deletion while editing text)

### Function Management

-   **Multiple Runtimes**: Support for Node.js (18, 20) and Python (3.9, 3.10, 3.11)
-   **Environment Variables**: Configure runtime environment per function with sensitive value masking
-   **HTTP Routes**: Custom API endpoints for each function
-   **Code Editor**: Full-featured Monaco editor with file tree navigation
-   **File Management**: Create files/folders, organize code with directory structure
-   **Batch Save**: All file changes are tracked in memory and saved together with metadata
-   **Modified Indicator**: Visual feedback for unsaved changes in the editor

### Security & Vulnerability Checks

-   **AI-Powered Analysis**: OpenAI-based code vulnerability detection
-   **Security Scanning**: Checks for infinite loops, filesystem access, DDoS risks, and more
-   **Severity Levels**: Categorized vulnerability reports (low, medium, high, critical)

## 🚀 Getting Started

### Prerequisites

-   Node.js 18 or later
-   npm or yarn
-   AWS Account (for production deployment)
-   OpenAI API Key (optional, for vulnerability checks)

### Installation

```bash
# Clone the repository
git clone https://github.com/Softbank-Hackathon-2025-Team-Green/web.git
cd web

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Edit .env.local with your credentials:
# - AWS credentials for S3, DynamoDB, and Lambda
# - OpenAI API key for vulnerability checking

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the platform.

</details>
