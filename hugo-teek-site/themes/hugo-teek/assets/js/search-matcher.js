/**
 * 搜索匹配器 - 三层匹配逻辑
 * 复刻 Rspress 的搜索匹配策略
 */
(function() {
  'use strict';

  const THRESHOLD_CONTENT_LENGTH = 100;

  class SearchMatcher {
    constructor() {
      this.normalizeCache = new Map();
    }

    // 主匹配函数
    match(keyword, searchResults) {
      const results = [];
      const normalizedKeyword = this.normalizeText(keyword);

      for (const item of searchResults) {
        // 第一层：标题匹配
        this.matchTitle(item, normalizedKeyword, results);

        // 第二层：标题匹配（显示完整路径）
        const matchedHeaders = this.matchHeaders(item, normalizedKeyword, results);

        // 第三层：内容匹配（避免重复）
        this.matchContent(item, normalizedKeyword, results, matchedHeaders);
      }

      return results;
    }

    // 第一层：标题匹配
    matchTitle(item, query, results) {
      const normalizedTitle = this.normalizeText(item.title);
      const index = normalizedTitle.indexOf(query);

      if (index !== -1) {
        results.push({
          type: 'title',
          title: item.title,
          header: item.title,
          link: item.routePath,
          query,
          highlightStart: index,
          highlightLength: query.length,
          score: 100  // 标题匹配最高优先级
        });
        return true;
      }
      return false;
    }

    // 第二层：标题匹配（显示完整路径）
    matchHeaders(item, query, results) {
      const matchedSet = new Set();
      const toc = item.toc || [];

      for (let i = 0; i < toc.length; i++) {
        const header = toc[i];
        const normalizedHeader = this.normalizeText(header.text);
        const index = normalizedHeader.indexOf(query);

        if (index !== -1) {
          // 🔥 回溯父级标题
          const headerPath = this.backTrackHeaders(toc, i);
          const pathStr = headerPath.map(h => h.text).join(' > ');

          results.push({
            type: 'header',
            title: item.title,
            header: `${item.title} > ${pathStr}`,
            link: `${item.routePath}#${header.id}`,
            query,
            highlightStart: index,
            highlightLength: query.length,
            score: 80  // 标题匹配次高优先级
          });

          matchedSet.add(header.id);
        }
      }

      return matchedSet;
    }

    // 第三层：内容匹配
    matchContent(item, query, results, matchedHeaders) {
      const { content, toc = [] } = item;
      if (!content || content.length === 0) return;

      const normalizedContent = this.normalizeText(content);
      const headersIndex = toc.map(h => h.charIndex);

      let queryIndex = normalizedContent.indexOf(query);
      let matchCount = 0;

      while (queryIndex !== -1 && matchCount < 3) {  // 限制每个文档最多3个内容匹配
        const currentHeader = this.getCurrentHeader(queryIndex, headersIndex, toc);

        // 🔥 避免重复：如果标题已匹配，跳过该区块
        if (!currentHeader || !matchedHeaders.has(currentHeader.id)) {
          const context = this.extractContext(content, queryIndex, query);

          results.push({
            type: 'content',
            title: item.title,
            header: currentHeader ? currentHeader.text : item.title,
            statement: context,
            link: `${item.routePath}${currentHeader ? `#${currentHeader.id}` : ''}`,
            query,
            highlightStart: queryIndex,
            highlightLength: query.length,
            score: 60 - matchCount * 10  // 内容匹配优先级递减
          });

          if (currentHeader) {
            matchedHeaders.add(currentHeader.id);
          }

          matchCount++;
        }

        queryIndex = normalizedContent.indexOf(query, queryIndex + 1);
      }
    }

    // 🔥 回溯父级标题（关键算法）
    backTrackHeaders(toc, currentIndex) {
      const result = [];
      const currentLevel = toc[currentIndex].level;

      // 向前查找父级标题
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (toc[i].level < currentLevel) {
          result.unshift(toc[i]);
          // 如果到达 H2，停止回溯
          if (toc[i].level === 2) break;
        }
      }

      result.push(toc[currentIndex]);
      return result;
    }

    // 获取当前位置对应的标题
    getCurrentHeader(position, headersIndex, toc) {
      for (let i = 0; i < headersIndex.length; i++) {
        const currentIndex = headersIndex[i];
        const nextIndex = i < headersIndex.length - 1 ? headersIndex[i + 1] : Infinity;

        if (position >= currentIndex && position < nextIndex) {
          return toc[i];
        }
      }

      // 如果在最后一个标题之后
      if (headersIndex.length > 0 && position >= headersIndex[headersIndex.length - 1]) {
        return toc[toc.length - 1];
      }

      return null;
    }

    // 提取上下文（智能截断）
    extractContext(content, position, query) {
      const maxLength = THRESHOLD_CONTENT_LENGTH;
      const halfLength = Math.floor((maxLength - query.length) / 2);

      // 查找段落边界
      let start = Math.max(0, position - halfLength);
      let end = Math.min(content.length, position + query.length + halfLength);

      // 尝试在换行符处截断
      const beforeNewline = content.lastIndexOf('\n', position);
      if (beforeNewline > start) {
        start = beforeNewline + 1;
      }

      const afterNewline = content.indexOf('\n', position + query.length);
      if (afterNewline !== -1 && afterNewline < end) {
        end = afterNewline;
      }

      let context = content.slice(start, end).trim();

      // 添加省略号
      if (start > 0) context = '...' + context;
      if (end < content.length) context = context + '...';

      return context;
    }

    // 标准化文本（小写 + trim + 缓存）
    normalizeText(text) {
      if (!text) return '';

      if (this.normalizeCache.has(text)) {
        return this.normalizeCache.get(text);
      }

      const normalized = text.toLowerCase().trim();

      // 限制缓存大小
      if (this.normalizeCache.size > 1000) {
        this.normalizeCache.clear();
      }

      this.normalizeCache.set(text, normalized);
      return normalized;
    }

    // 高亮匹配文本
    highlightMatch(text, query) {
      if (!query) return text;

      const normalizedText = this.normalizeText(text);
      const normalizedQuery = this.normalizeText(query);
      const index = normalizedText.indexOf(normalizedQuery);

      if (index === -1) return text;

      const before = text.slice(0, index);
      const match = text.slice(index, index + query.length);
      const after = text.slice(index + query.length);

      return `${before}<mark>${match}</mark>${after}`;
    }
  }

  // 暴露到全局
  window.SearchMatcher = SearchMatcher;

  console.log('[SearchMatcher] 模块已加载');
})();
