# 在庫掲載サイト

Astro + Decap CMS によるGit管理の在庫掲載サイトです。

## 🚀 クイックスタート

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

---

## 📁 プロジェクト構成

```
inventory-site/
├── public/
│   ├── admin/           # Decap CMS管理画面
│   │   ├── index.html
│   │   └── config.yml   # CMS設定
│   └── images/products/ # 商品画像
├── src/
│   ├── content/products/ # 商品データ（Markdown）
│   ├── pages/           # ページ
│   ├── components/      # コンポーネント
│   └── lib/             # ユーティリティ
└── functions/api/       # Cloudflare Functions（認証）
```

---

## 🔐 認証設定（GitHub OAuth）

### 1. GitHub OAuth App作成

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. 以下を入力:
   - **Application name**: `Inventory CMS`
   - **Homepage URL**: `https://<< your-domain.com >>`
   - **Authorization callback URL**: `https://<< your-domain.com >>/api/auth`
3. **Client ID** と **Client Secret** をメモ

### 2. Cloudflare Pages環境変数設定

Cloudflare Dashboard → Pages → プロジェクト → Settings → Environment variables

| 変数名 | 値 |
|--------|-----|
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret |

### 3. config.yml確認

`public/admin/config.yml` の以下を確認:

```yaml
backend:
  name: github
  repo: << owner/repo >>
  branch: main
  base_url: https://<< your-domain.com >>
  auth_endpoint: /api/auth
```

---

## 🔄 デプロイ設定（Cloudflare Pages）

### 1. Cloudflare Pagesプロジェクト作成

1. Cloudflare Dashboard → Pages → Create a project
2. Connect to Git → GitHubリポジトリを選択
3. ビルド設定:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 2. カスタムドメイン設定

Pages → Custom domains → Add custom domain

### 3. 自動デプロイ

`main`ブランチへのpushで自動デプロイされます。

---

## 📦 商品データ管理

### ファイル形式

```yaml
# src/content/products/example.md
---
id: "prod_001"
title: "商品名"
slug: "example-product"
price: 10000
status: "active"
description: "商品の概要"
coverImage: "/images/products/prod_001/cover.jpg"
images:
  - "/images/products/prod_001/01.jpg"
tags:
  - "カテゴリA"
purchaseUrl: "https://mercari.com/..."
priority: 50
publishedAt: 2024-01-01T10:00:00+09:00
updatedAt: 2024-01-01T10:00:00+09:00
notes: "非公開メモ"
---

詳細説明（Markdown）
```

### ステータス一覧

| ステータス | 説明 | 一覧表示 | 購入URL |
|------------|------|----------|---------|
| `draft` | 下書き | ❌ | ❌ |
| `active` | 販売中 | ✅ | ✅ |
| `reserved` | 取り置き中 | ✅ | ❌ |
| `sold` | 売却済 | ✅ | ❌ |
| `hidden` | 非表示 | ❌ | ❌ |

### 状態遷移フロー

```
draft → active → reserved → sold
                ↘ hidden ↗
```

**推奨運用:**
1. 新規商品: `draft` で作成 → 写真・説明を完成 → `active` に変更
2. 取り置き: `active` → `reserved`
3. 売却: `reserved` または `active` → `sold`
4. 非表示にしたい場合: → `hidden`
5. 再販売: `sold`/`hidden` → `active`

---

## 🖼️ 画像管理

### 推奨仕様

| 項目 | 推奨値 |
|------|--------|
| カバー画像サイズ | 1200 x 1200 px |
| 追加画像サイズ | 1200 x 1200 px |
| ファイル形式 | JPEG, WebP |
| 最大ファイルサイズ | 5MB |

### ディレクトリ構成

```
public/images/products/
├── prod_001/
│   ├── cover.jpg
│   ├── 01.jpg
│   └── 02.jpg
└── prod_002/
    └── cover.jpg
```

### CMS経由のアップロード

1. 管理画面で商品を編集
2. 画像フィールドで「Choose an image」
3. アップロードまたは既存画像を選択

---

## 🔧 ローカル開発

### CMSローカルプロキシ

```bash
# 別ターミナルで実行
npx decap-server
```

`http://localhost:8081/admin` でローカルCMSが使用可能

### 環境変数（ローカル）

```bash
# .env.local
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
```

---

## 🚨 トラブルシューティング

### CMS認証エラー

1. GitHub OAuth AppのCallback URLを確認
2. Cloudflare環境変数を確認
3. ブラウザのコンソールでエラーを確認

### ビルドエラー

```bash
# キャッシュクリア
rm -rf node_modules .astro dist
npm install
npm run build
```

### 画像が表示されない

1. ファイルパスが正しいか確認（`/images/products/...`）
2. ファイルが `public/` ディレクトリにあるか確認
3. ファイル名の大文字小文字を確認

---

## ⏪ ロールバック手順

### Cloudflare Pagesでロールバック

1. Cloudflare Dashboard → Pages → プロジェクト
2. Deployments タブ
3. 戻したいデプロイの「...」→「Rollback to this deploy」

### Gitでロールバック

```bash
# 直前のコミットに戻す
git revert HEAD
git push origin main

# 特定のコミットに戻す
git revert <commit-hash>
git push origin main

# 強制的に戻す（チーム運用では非推奨）
git reset --hard <commit-hash>
git push --force origin main
```

---

## 👥 運用ルール（<< 1〜3 >>人運用）

### 編集フロー

1. **同時編集を避ける**: CMSで編集中は他の人に連絡
2. **ステータス変更は確実に**: 売却後は速やかに `sold` に変更
3. **画像は事前にリサイズ**: 1200x1200px以下に

### コミット規則

```
feat: 新商品追加（prod_xxx）
update: 商品更新（prod_xxx）
fix: 修正
docs: ドキュメント更新
```

### バックアップ

- GitHubリポジトリ自体がバックアップ
- 定期的に `git pull` でローカルに同期推奨

---

## 📋 チェックリスト

### 公開前チェック

- [ ] 商品タイトルが正確
- [ ] 価格が正しい
- [ ] 購入URLが有効
- [ ] カバー画像がある
- [ ] ステータスが `active`
- [ ] タグが適切

### 売却時チェック

- [ ] ステータスを `sold` に変更
- [ ] 購入URLをそのままにする（非表示になる）

---

## 🔗 関連リンク

- [Astro Documentation](https://docs.astro.build)
- [Decap CMS Documentation](https://decapcms.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)

---

## ライセンス

MIT License
