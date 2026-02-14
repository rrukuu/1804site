// src/content/config.ts
import { defineCollection, z } from 'astro:content';

// 商品ステータスの列挙型
const productStatus = z.enum(['draft', 'active', 'reserved', 'sold', 'hidden']);
const productCategory = z.enum(['orb-account', 'boosting', 'strong-account']);

// 商品コレクションの定義
const productsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // 必須フィールド
    id: z.string(),
    title: z.string(),
    price: z.number().min(0),
    status: productStatus,
    category: productCategory,

    // 説明（Markdownボディとは別のサマリー）
    description: z.string(),

    // 画像
    coverImage: z.string(),
    images: z.array(z.string()).default([]),

    // 分類
    tags: z.array(z.string()).default([]),

    // オーブ関連（オーブアカウント用）
    orbCount: z.number().min(0).optional(),

    // 購入導線
    purchaseUrl: z.string().url().optional(),

    // 表示優先度（0-100、大きいほど上位）
    priority: z.number().min(0).max(100).default(50),

    // 日時
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),

    // 非公開メモ（CMSで編集可能、フロントには出さない）
    notes: z.string().optional(),
  }),
});

export const collections = {
  products: productsCollection,
};

// 型エクスポート（ユーティリティ用）
export type ProductStatus = z.infer<typeof productStatus>;
export type ProductCategory = z.infer<typeof productCategory>;
