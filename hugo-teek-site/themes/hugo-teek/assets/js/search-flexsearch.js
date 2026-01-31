/**
 * FlexSearch 搜索提供者（Web Worker 版本）
 * 使用 Worker 后台构建索引，不阻塞主线程
 */
(function() {
  'use strict';

  // 等待 FlexSearch 库加载（Worker 会自己加载）
  function waitForFlexSearch(callback) {
    // 主线程不需要 FlexSearch 库，Worker 会加载
    callback();
  }

  class FlexSearchProvider {
    constructor() {
      this.worker = null;
      this.initialized = false;
      this.initializing = false;
      this.searchCallbacks = new Map(); // 存储搜索回调
      this.searchId = 0;
    }

    // 初始化（懒加载）
    async init() {
      // 如果已经初始化，直接返回
      if (this.initialized) {
        return true;
      }

      // 如果正在初始化，等待完成
      if (this.initializing) {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.initialized || !this.initializing) {
              clearInterval(checkInterval);
              resolve(this.initialized);
            }
          }, 100);
        });
      }

      this.initializing = true;
      console.log('[FlexSearch] 🔍 开始加载搜索索引...');

      try {
        // 🚀 创建 Web Worker
        this.worker = new Worker('/js/search-worker.js');

        // 监听 Worker 消息
        this.worker.addEventListener('message', (e) => {
          this.handleWorkerMessage(e.data);
        });

        this.worker.addEventListener('error', (e) => {
          console.error('[FlexSearch] ❌ Worker 错误:', e);
          this.initializing = false;
        });

        // 📦 加载索引数据（localStorage + manifest 版本控制）
        const STORAGE_KEY = 'flexsearch-index-data';
        const VERSION_KEY = 'flexsearch-index-version';

        // 1. 获取 manifest 版本
        const manifestUrl = '/data/search/manifest.json';
        const manifestResponse = await fetch(manifestUrl, { cache: 'no-cache' });
        const manifest = await manifestResponse.json();
        const currentVersion = manifest.version;

        console.log(`[FlexSearch] 📋 当前索引版本: ${currentVersion}`);

        // 2. 检查 localStorage 缓存
        const cachedVersion = localStorage.getItem(VERSION_KEY);
        const cachedData = localStorage.getItem(STORAGE_KEY);

        let indexData;

        if (cachedVersion === currentVersion && cachedData) {
          // 版本匹配，直接使用缓存
          console.log('[FlexSearch] ⚡ 从 localStorage 加载索引（瞬时加载）');
          indexData = JSON.parse(cachedData);
          console.log(`[FlexSearch] ✅ 加载到 ${indexData.length} 个文档（从缓存）`);
        } else {
          // 版本不匹配或无缓存，从网络加载
          if (cachedVersion) {
            console.log(`[FlexSearch] 🔄 版本变更 (${cachedVersion} → ${currentVersion})，更新索引`);
          } else {
            console.log('[FlexSearch] 📥 首次加载，下载索引...');
          }

          const indexUrl = '/data/search/index.json.gz';
          const response = await fetch(indexUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('Content-Type');
          const contentEncoding = response.headers.get('Content-Encoding');

          // 检查服务器是否已解压
          if (contentEncoding === 'gzip' || contentType?.includes('application/json')) {
            console.log('[FlexSearch] 服务器已解压，直接读取 JSON');
            indexData = await response.json();
          } else {
            console.log('[FlexSearch] 手动解压 gzip 数据');
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const decompressed = window.pako.inflate(uint8Array, { to: 'string' });
            indexData = JSON.parse(decompressed);
          }

          console.log(`[FlexSearch] ✅ 加载到 ${indexData.length} 个文档`);

          // 3. 保存到 localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(indexData));
            localStorage.setItem(VERSION_KEY, currentVersion);
            console.log('[FlexSearch] 💾 索引已缓存到 localStorage');
          } catch (err) {
            console.warn('[FlexSearch] ⚠️ localStorage 存储失败（可能超出配额）:', err);
            // 清理旧数据重试
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VERSION_KEY);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(indexData));
              localStorage.setItem(VERSION_KEY, currentVersion);
              console.log('[FlexSearch] 💾 重试成功，索引已缓存');
            } catch (retryErr) {
              console.warn('[FlexSearch] ⚠️ 无法缓存索引，将在下次重新下载');
            }
          }
        }

        // 4. 🚀 传递数据给 Worker 构建索引（后台线程，不阻塞！）
        console.log('[FlexSearch] 🔨 传递数据给 Worker 后台构建索引...');
        this.worker.postMessage({
          type: 'BUILD_INDEX',
          payload: {
            data: indexData,
            version: currentVersion
          }
        });

        // 等待 Worker 构建完成
        return new Promise((resolve) => {
          this.initResolve = resolve;
        });

      } catch (error) {
        console.error('[FlexSearch] 初始化失败:', error);
        this.initializing = false;
        return false;
      }
    }

    // 处理 Worker 消息
    handleWorkerMessage(message) {
      const { type, payload } = message;

      switch (type) {
        case 'INIT_SUCCESS':
          console.log(`[FlexSearch] ✅ Worker 索引构建完成！文档数: ${payload.documentCount}`);
          this.initialized = true;
          this.initializing = false;
          if (this.initResolve) {
            this.initResolve(true);
            this.initResolve = null;
          }
          break;

        case 'INIT_ERROR':
          console.error('[FlexSearch] ❌ Worker 初始化失败:', payload.error);
          this.initializing = false;
          if (this.initResolve) {
            this.initResolve(false);
            this.initResolve = null;
          }
          break;

        case 'SEARCH_RESULTS':
          const callback = this.searchCallbacks.get(payload.keyword);
          if (callback) {
            callback(payload.results);
            this.searchCallbacks.delete(payload.keyword);
          }
          break;

        case 'SEARCH_ERROR':
          console.error('[FlexSearch] ❌ Worker 搜索失败:', payload.error);
          break;

        default:
          console.warn('[FlexSearch] 未知消息类型:', type);
      }
    }

    // 搜索
    async search(keyword, limit = 10) {
      if (!this.initialized) {
        console.warn('[FlexSearch] 尚未初始化');
        return [];
      }

      // 发送搜索请求给 Worker
      return new Promise((resolve) => {
        this.searchCallbacks.set(keyword, resolve);

        this.worker.postMessage({
          type: 'SEARCH',
          payload: {
            keyword,
            limit
          }
        });
      });
    }

    // 获取文档详情（不需要了，搜索结果已包含完整文档）
    getDocument(id) {
      console.warn('[FlexSearch] getDocument() 已废弃，搜索结果包含完整文档');
      return null;
    }
  }

  // 暴露到全局
  window.FlexSearchProvider = FlexSearchProvider;

  console.log('[FlexSearch] 模块已加载（Web Worker 版本）');
})();
