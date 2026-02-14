import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://1804site.pages.dev',
  output: 'static',
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
  image: {
    // 画像最適化設定
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
    // リモート画像を許可するドメイン（必要に応じて追加）
    domains: [],
    // ローカル画像の最適化
    remotePatterns: [],
  },
  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          assetFileNames: '_assets/[name].[hash][extname]',
        },
      },
    },
  },
  // トレイリングスラッシュなし
  trailingSlash: 'never',
});
