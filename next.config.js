/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 启用静态导出
  basePath: '/real-time-fund', // GitHub Pages 仓库路径
  assetPrefix: '/real-time-fund/', // 静态资源路径前缀
  images: {
    unoptimized: true, // 禁用图片优化（静态导出不支持）
  },
};

module.exports = nextConfig;
