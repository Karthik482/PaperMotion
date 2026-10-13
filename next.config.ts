import type { NextConfig } from 'next';
const config: NextConfig = { devIndicators: false, distDir: process.env.PAPERMOTION_TEST_BUILD === '1' ? '.next-test' : '.next', serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas'] };
export default config;
