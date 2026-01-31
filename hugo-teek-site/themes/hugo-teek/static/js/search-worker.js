/**
 * FlexSearch Web Worker - 后台处理搜索索引
 * 在独立线程中构建索引，不阻塞主线程
 */

// Worker 内部导入 FlexSearch 库
importScripts('https://unpkg.com/flexsearch@0.7.31/dist/flexsearch.bundle.js');

let index = null;
let cjkIndex = null;
let indexData = [];
let initialized = false;

// 监听主线程消息（统一处理）
self.addEventListener('message', async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'BUILD_INDEX':
      await buildIndex(payload);
      break;

    case 'SEARCH':
      await performSearch(payload);
      break;

    case 'STATUS':
      self.postMessage({
        type: 'STATUS_RESPONSE',
        payload: { initialized }
      });
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
});

// 构建索引
async function buildIndex({ data, version }) {
  try {
    console.log(`[Worker] 📦 接收到索引数据: ${data.length} 个文档`);

    indexData = data;

    // 创建英文索引
    index = new FlexSearch.Document({
      tokenize: 'full',
      document: {
        id: 'id',
        store: true,
        index: ['normalizedTitle', 'headers', 'normalizedContent']
      },
      cache: 100
    });

    // 创建 CJK 索引
    const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]|[\u3040-\u309F]|[\u30A0-\u30FF]/g;
    cjkIndex = new FlexSearch.Document({
      tokenize: 'full',
      encode: str => {
        const chars = [];
        const matches = str.match(cjkRegex);
        if (matches) {
          chars.push(...matches);
        }
        const words = str.replace(cjkRegex, ' ').split(/\s+/).filter(w => w.length > 0);
        chars.push(...words);
        return chars;
      },
      document: {
        id: 'id',
        store: true,
        index: ['normalizedTitle', 'headers', 'normalizedContent']
      },
      cache: 100
    });

    console.log('[Worker] 🔨 开始构建索引...');

    // 批量添加文档
    for (const item of indexData) {
      index.add(item);
      cjkIndex.add(item);
    }

    initialized = true;
    console.log('[Worker] ✅ 索引构建完成！');

    self.postMessage({
      type: 'INIT_SUCCESS',
      payload: {
        version,
        documentCount: indexData.length
      }
    });

  } catch (error) {
    console.error('[Worker] ❌ 构建索引失败:', error);
    self.postMessage({
      type: 'INIT_ERROR',
      payload: { error: error.message }
    });
  }
}

// 执行搜索
async function performSearch({ keyword, limit = 10 }) {
  if (!initialized) {
    self.postMessage({
      type: 'SEARCH_ERROR',
      payload: { error: '索引未初始化' }
    });
    return;
  }

  try {
    const options = {
      limit,
      enrich: true,
      index: ['normalizedTitle', 'headers', 'normalizedContent']
    };

    // 并行搜索
    const [englishResults, cjkResults] = await Promise.all([
      index.searchAsync(keyword, options),
      cjkIndex.searchAsync(keyword, options)
    ]);

    // 合并去重
    const seen = new Set();
    const merged = [];

    const addResults = (results) => {
      for (const resultArray of results) {
        if (!resultArray || !resultArray.result) continue;

        for (const item of resultArray.result) {
          const id = item.doc.id;
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(item.doc);
          }
        }
      }
    };

    addResults(englishResults);
    addResults(cjkResults);

    console.log(`[Worker] 🔍 搜索 "${keyword}" 找到 ${merged.length} 个结果`);

    self.postMessage({
      type: 'SEARCH_RESULTS',
      payload: {
        keyword,
        results: merged
      }
    });

  } catch (error) {
    console.error('[Worker] ❌ 搜索失败:', error);
    self.postMessage({
      type: 'SEARCH_ERROR',
      payload: { error: error.message }
    });
  }
}

console.log('[Worker] ✅ 搜索 Worker 已启动');

