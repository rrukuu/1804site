// src/lib/products.ts
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ProductCategory, ProductStatus } from '../content/config';

export type Product = CollectionEntry<'products'>;

export interface ProductQuery {
  category?: ProductCategory;
  tag?: string;
  orbMin?: number;
  orbMax?: number;
  sort?: 'newest' | 'price-high' | 'price-low' | 'orb-high' | 'orb-low';
}

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

export const PRODUCT_CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: 'orb-account', label: 'アカウント販売（オーブアカウント）' },
  { key: 'boosting', label: '代行' },
  { key: 'strong-account', label: '強垢販売' },
];

export function getCategoryLabel(category: ProductCategory): string {
  return PRODUCT_CATEGORIES.find((item) => item.key === category)?.label ?? category;
}

function sortProducts(products: Product[], sort: ProductQuery['sort'] = 'newest'): Product[] {
  return products.sort((a, b) => {
    const statusDiff = STATUS_PRIORITY[a.data.status] - STATUS_PRIORITY[b.data.status];
    if (statusDiff !== 0) return statusDiff;

    if (sort === 'price-high') return b.data.price - a.data.price;
    if (sort === 'price-low') return a.data.price - b.data.price;
    if (sort === 'orb-high') return (b.data.orbCount ?? 0) - (a.data.orbCount ?? 0);
    if (sort === 'orb-low') return (a.data.orbCount ?? 0) - (b.data.orbCount ?? 0);

    return b.data.updatedAt.getTime() - a.data.updatedAt.getTime();
  });
}

export async function getVisibleProducts(): Promise<Product[]> {
  const allProducts = await getCollection('products');
  return allProducts.filter((product) => VISIBLE_STATUSES.includes(product.data.status));
}

export async function getFilteredProducts(query: ProductQuery = {}): Promise<Product[]> {
  const visibleProducts = await getVisibleProducts();

  const filtered = visibleProducts.filter((product) => {
    if (query.category && product.data.category !== query.category) return false;
    if (query.tag && !product.data.tags.includes(query.tag)) return false;
    if (typeof query.orbMin === 'number' && (product.data.orbCount ?? 0) < query.orbMin) return false;
    if (typeof query.orbMax === 'number' && (product.data.orbCount ?? 0) > query.orbMax) return false;
    return true;
  });

  return sortProducts(filtered, query.sort);
}

export async function getAllProducts(): Promise<Product[]> {
  const allProducts = await getCollection('products');
  return sortProducts(allProducts);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const allProducts = await getCollection('products');
  return allProducts.find((product) => product.slug === slug);
}

export async function getTagsByCategory(category?: ProductCategory): Promise<{ tag: string; count: number }[]> {
  const visibleProducts = await getVisibleProducts();
  const tagCounts = new Map<string, number>();

  visibleProducts
    .filter((product) => (category ? product.data.category === category : true))
    .forEach((product) => {
      product.data.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

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

export function shouldShowPurchaseUrl(status: ProductStatus): boolean {
  return status === 'active';
}

export function sanitizeForPublic(product: Product): Omit<Product['data'], 'notes'> & { notes?: never } {
  const { notes, ...publicData } = product.data;
  return publicData;
}
