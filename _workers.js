// 确保启用 Gzip/Brotli 压缩和其他优化

export default {
  async fetch(request, env) {
    const response = await fetch(request);

    // 克隆响应以便修改 headers
    const newResponse = new Response(response.body, response);

    // 设置缓存 headers
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.match(/\.(css|js)$/)) {
      // CSS/JS - 长期缓存
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
      // 图片 - 长期缓存
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(woff|woff2|ttf|otf)$/)) {
      // 字体 - 长期缓存
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
    } else if (path.endsWith('.html') || path === '/' || !path.includes('.')) {
      // HTML - 短缓存
      newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    }

    // 安全 headers
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');

    return newResponse;
  }
};
