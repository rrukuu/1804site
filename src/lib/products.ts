// src/lib/products.ts
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ProductStatus } from '../content/config';

export type Product = CollectionEntry<'products'>;

/**
 * 公開可能なステータス（一覧・詳細に表示するもの）
 */
const VISIBLE_STATUSES: ProductStatus[] = ['active', 'reserved', 'sold'];

/**
 * ステータスの表示優先順（小さいほど上位）
 */
const STATUS_PRIORITY: Record<ProductStatus, number> = {
  active: 0,
  reserved: 1,
  sold: 2,
  draft: 3,
  hidden: 4,
};

/**
 * 商品を並び替える
 * 1. active優先
 * 2. priority降順
 * 3. updatedAt降順
 */
function sortProducts(products: Product[]): Product[] {
  return products.sort((a, b) => {
    // ステータス優先度で比較
    const statusDiff = STATUS_PRIORITY[a.data.status] - STATUS_PRIORITY[b.data.status];
    if (statusDiff !== 0) return statusDiff;

    // priority降順
    const priorityDiff = b.data.priority - a.data.priority;
    if (priorityDiff !== 0) return priorityDiff;

    // updatedAt降順
    return b.data.updatedAt.getTime() - a.data.updatedAt.getTime();
  });
}

/**
 * 公開用の商品一覧を取得（draft/hidden除外、並び替え済み）
 */
export async function getVisibleProducts(): Promise<Product[]> {
  const allProducts = await getCollection('products');
  const visibleProducts = allProducts.filter(
    (product) => VISIBLE_STATUSES.includes(product.data.status)
  );
  return sortProducts(visibleProducts);
}

/**
 * 全商品を取得（管理用、並び替え済み）
 */
export async function getAllProducts(): Promise<Product[]> {
  const allProducts = await getCollection('products');
  return sortProducts(allProducts);
}

/**
 * slugから商品を取得
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const allProducts = await getCollection('products');
  return allProducts.find((product) => product.slug === slug);
}

/**
 * タグでフィルタした商品を取得
 */
export async function getProductsByTag(tag: string): Promise<Product[]> {
  const visibleProducts = await getVisibleProducts();
  return visibleProducts.filter((product) => 
    product.data.tags.includes(tag)
  );
}

/**
 * 全タグを取得（使用頻度順）
 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const visibleProducts = await getVisibleProducts();
  const tagCounts = new Map<string, number>();

  visibleProducts.forEach((product) => {
    product.data.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * ステータスのラベルを取得
 */
export function getStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    draft: '下書き',
    active: '販売中',
    reserved: '取り置き中',
    sold: '売却済',
    hidden: '非表示',
  };
  return labels[status];
}

/**
 * 購入URLを表示すべきか判定
 */
export function shouldShowPurchaseUrl(status: ProductStatus): boolean {
  return status === 'active';
}

/**
 * notesフィールドを除外した商品データを返す（公開用）
 */
export function sanitizeForPublic(product: Product): Omit<Product['data'], 'notes'> & { notes?: never } {
  const { notes, ...publicData } = product.data;
  return publicData;
}
