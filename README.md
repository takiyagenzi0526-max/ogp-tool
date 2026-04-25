# OGP Redirect Tool (Twiliaの短縮URL機能 自作版)

カスタムサムネイル画像付きの短縮URLを発行するNext.jsアプリです。
ツイートに貼ったときに、好きなOGP画像・タイトル・説明文を表示できます。

## 仕組み

```
Twitterに投稿: https://yoursite.vercel.app/l/abc123
    ↓ Twitterのクローラーがアクセス
    ↓ /l/[id] が指定したOGPタグ付きHTMLを返す
    ↓ Twitterがサムネ・タイトル・説明文を表示
    ↓ 人間がクリック → JSで実際のリンク先(Canva等)にリダイレクト
```

## セットアップ手順

### 1. プロジェクトをローカルに置く

このフォルダをそのまま使ってください。

```powershell
cd ogp-tool
npm install
```

### 2. GitHubにプッシュ

```powershell
git init
git add .
git commit -m "initial"
# GitHubで新規リポジトリを作って、そのURLを設定
git remote add origin https://github.com/<あなた>/<リポジトリ名>.git
git branch -M main
git push -u origin main
```

### 3. Vercelにデプロイ

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New」→「Project」→ GitHubのリポジトリをImport
3. そのままDeploy（環境変数は次のステップで追加）

### 4. Vercel KVを作成する

1. デプロイしたプロジェクトの画面で「Storage」タブを開く
2. 「Create Database」→「KV (Redis)」を選んで作成
3. 「Connect to Project」で今のプロジェクトに接続
4. 接続すると `KV_URL` などの環境変数が自動で追加される

### 5. 管理画面のパスワードを設定

「Settings」→「Environment Variables」で次の2つを追加:

| キー | 値 |
|---|---|
| `ADMIN_USER` | `admin` (好きなユーザー名) |
| `ADMIN_PASSWORD` | 好きなパスワード |

### 6. 再デプロイ

「Deployments」タブで最新のデプロイの右上「…」→「Redeploy」

## 使い方

### 管理画面でリンクを作る

1. `https://yoursite.vercel.app/admin` にアクセス
2. ブラウザがBasic認証を求めてくるので、設定したユーザー名・パスワードを入力
3. フォームに入力:
   - **タイトル**: ツイートのカードに表示される
   - **ディスクリプション**: 説明文(任意)
   - **リンク先URL**: `https://keikeiaa.my.canva.site/` など、実際に飛ばしたい先
   - **OGP画像URL**: 1200x630pxの画像の公開URL
4. 「短縮URLを作成」をクリック
5. 一覧に追加された `https://yoursite.vercel.app/l/abc123` をコピー

### ツイートする

そのまま X(Twitter) のツイート欄に貼り付けるだけ。
カスタムサムネが表示されます。

## OGP画像の置き場所

画像URLは公開アクセスできるURLならどこでもOK:

- **Canvaで画像をデザインしてダウンロード → Vercelの`public/`フォルダに置く**
  - `public/ogp1.jpg` に置けば `https://yoursite.vercel.app/ogp1.jpg` で使える
  - 画像追加のたびに git push が必要だが、無料・確実
- **Cloudinary, Imgur 等の画像ホスティング**
  - URLを発行してくれるサービスならなんでも

## ツイート時にサムネが反映されないときは

Twitterは一度読んだOGPをキャッシュします:

- 短縮URLにクエリ追加で別URL扱いに: `https://yoursite.vercel.app/l/abc123?v=2`
- もしくは新しい短縮URLを作り直す

## ローカルで開発する

```powershell
# .env.local を作成
copy .env.example .env.local
# Vercelダッシュボードから KV_REST_API_URL と KV_REST_API_TOKEN をコピーして貼り付け
# ADMIN_USER, ADMIN_PASSWORD も設定

npm run dev
```

ブラウザで `http://localhost:3000/admin` を開く。

## ファイル構成

```
ogp-tool/
├── app/
│   ├── layout.tsx           # 共通レイアウト
│   ├── page.tsx             # ランディング (/)
│   ├── globals.css
│   ├── admin/
│   │   └── page.tsx         # 管理画面 (/admin)
│   ├── api/
│   │   └── links/
│   │       ├── route.ts     # POST/GET /api/links
│   │       └── [id]/
│   │           └── route.ts # DELETE /api/links/[id]
│   └── l/
│       └── [id]/
│           └── route.ts     # 公開URL /l/[id] (OGP+リダイレクト)
├── middleware.ts            # /admin と /api/links のBasic認証
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
└── README.md
```
