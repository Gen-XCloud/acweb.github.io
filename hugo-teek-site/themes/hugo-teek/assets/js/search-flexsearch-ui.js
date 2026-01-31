/**
 * 搜索模态框功能 - FlexSearch 版本
 * - Ctrl+K 快捷键打开
 * - FlexSearch 本地搜索集成
 * - 三层匹配逻辑（标题/标题/内容）
 * - CJK 中文优化
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'tk-search-history';
  const MAX_HISTORY = 5;
  let flexSearch = null;
  let searchMatcher = null;
  let searchTimeout = null;
  let currentSelectedIndex = -1;
  let currentResults = [];

  // DOM 元素
  let modal, overlay, input, contentArea, historySection, historyList;
  let emptyState, resultsSection, resultsList, loadingState, noResultsState;

  // 初始化
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDOMElements);
    } else {
      initDOMElements();
    }
  }

  // 初始化 DOM 元素和事件
  async function initDOMElements() {
    modal = document.getElementById('search-modal');
    overlay = document.getElementById('search-overlay');
    input = document.getElementById('search-modal-input');
    contentArea = document.getElementById('search-content');
    historySection = document.getElementById('search-history');
    historyList = document.getElementById('search-history-list');
    emptyState = document.getElementById('search-empty');
    resultsSection = document.getElementById('search-results');
    resultsList = document.getElementById('search-results-list');
    loadingState = document.getElementById('search-loading');
    noResultsState = document.getElementById('search-no-results');

    if (!modal) {
      console.warn('[Search] Required elements not found');
      return;
    }

    // 🔥 创建 FlexSearch 实例，但不立即初始化（懒加载）
    try {
      console.log('[Search] 等待 FlexSearch 库加载...');
      await waitForFlexSearch();

      flexSearch = new window.FlexSearchProvider();
      searchMatcher = new window.SearchMatcher();

      console.log('[Search] ✅ FlexSearch 实例已创建（索引将在打开搜索时加载）');
    } catch (err) {
      console.error('[Search] Failed to create FlexSearch instance:', err);
      return;
    }

    // 绑定事件
    bindEvents();

    // 初始化显示历史记录
    loadSearchHistory();

    console.log('[Search] ✅ 搜索模态框初始化完成');
  }

  // 等待 FlexSearch 库加载（Web Worker 版本不需要主线程加载 FlexSearch）
  function waitForFlexSearch() {
    return new Promise((resolve) => {
      function check() {
        // 只需要等待 FlexSearchProvider 和 SearchMatcher
        if (window.FlexSearchProvider && window.SearchMatcher) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      }
      check();
    });
  }

  // 绑定所有事件
  function bindEvents() {
    document.addEventListener('keydown', handleGlobalKeydown);

    const headerSearchBtn = document.getElementById('header-search-input');
    if (headerSearchBtn) {
      headerSearchBtn.addEventListener('click', openModal);
    }

    overlay.addEventListener('click', closeModal);
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleInputKeydown);

    const dialog = modal.querySelector('.tk-search-dialog');
    if (dialog) {
      dialog.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  // 全局键盘事件处理
  function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openModal();
    }
  }

  // 输入框键盘事件处理
  function handleInputKeydown(e) {
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (currentResults.length > 0 || historySection.style.display !== 'none') {
      const items = currentResults.length > 0
        ? resultsList.querySelectorAll('.tk-search-result-item')
        : historyList.querySelectorAll('.tk-search-history-item');

      if (items.length === 0) return;

      if (key === 'ArrowDown') {
        e.preventDefault();
        currentSelectedIndex = Math.min(currentSelectedIndex + 1, items.length - 1);
        updateSelection(items);
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        currentSelectedIndex = Math.max(currentSelectedIndex - 1, -1);
        updateSelection(items);
      } else if (key === 'Enter' && currentSelectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = items[currentSelectedIndex];
        if (selectedItem) {
          const link = selectedItem.tagName === 'A' ? selectedItem : selectedItem.querySelector('a');
          if (link) {
            if (selectedItem.classList.contains('tk-search-history-item')) {
              const query = selectedItem.dataset.query;
              if (query) {
                input.value = query;
                performSearch(query);
              }
            } else {
              window.location.href = link.href;
            }
          }
        }
      }
    }
  }

  // 输入事件处理
  function handleInput(e) {
    const query = e.target.value.trim();

    clearTimeout(searchTimeout);
    currentSelectedIndex = -1;

    if (query.length === 0) {
      showHistoryOrEmpty();
      return;
    }

    if (query.length < 2) {
      hideAllStates();
      return;
    }

    showLoading();

    // 防抖搜索
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }

  // 执行搜索
  async function performSearch(query) {
    if (!flexSearch || !searchMatcher) {
      console.error('[Search] Search not initialized');
      showError();
      return;
    }

    try {
      const startTime = performance.now();

      // 使用 FlexSearch 搜索
      const rawResults = await flexSearch.search(query, 20);

      if (!rawResults || rawResults.length === 0) {
        currentResults = [];
        showNoResults();
        return;
      }

      // 使用三层匹配逻辑处理结果
      const matchedResults = searchMatcher.match(query, rawResults);

      // 按得分排序
      matchedResults.sort((a, b) => b.score - a.score);

      // 限制结果数量
      const limitedResults = matchedResults.slice(0, 10);

      const endTime = performance.now();
      console.log(`[Search] 搜索耗时: ${(endTime - startTime).toFixed(2)}ms，找到 ${limitedResults.length} 个结果`);

      currentResults = limitedResults;
      showResults(limitedResults, query);

      // 保存搜索历史
      saveSearchHistory(query);
    } catch (err) {
      console.error('[Search] Search error:', err);
      showError();
    }
  }

  // 显示搜索结果
  function showResults(results, query) {
    hideAllStates();

    resultsList.innerHTML = results.map((result, index) => {
      const typeIcon = result.type === 'title' ? '📄' : result.type === 'header' ? '📑' : '📝';
      const typeClass = `tk-result-type-${result.type}`;

      // 高亮匹配文本
      const highlightedHeader = searchMatcher.highlightMatch(result.header, query);
      const highlightedStatement = result.statement ? searchMatcher.highlightMatch(result.statement, query) : '';

      return `
        <a href="${result.link}" class="tk-search-result-item ${typeClass}" data-index="${index}">
          <div class="tk-search-result-header">
            <span class="tk-result-icon">${typeIcon}</span>
            <div class="tk-search-result-title">${highlightedHeader}</div>
          </div>
          ${highlightedStatement ? `<div class="tk-search-result-excerpt">${highlightedStatement}</div>` : ''}
        </a>
      `;
    }).join('');

    resultsSection.style.display = 'block';
    bindResultItemEvents();
  }

  // 绑定结果项事件
  function bindResultItemEvents() {
    const items = resultsList.querySelectorAll('.tk-search-result-item');
    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        currentSelectedIndex = index;
        updateSelection(items);
      });
    });
  }

  // 更新选中状态
  function updateSelection(items) {
    items.forEach((item, index) => {
      if (index === currentSelectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // 加载搜索历史
  function loadSearchHistory() {
    const history = getSearchHistory();

    if (history.length === 0) {
      emptyState.style.display = 'flex';
      historySection.style.display = 'none';
      return;
    }

    historyList.innerHTML = history.map(query => `
      <div class="tk-search-history-item" data-query="${escapeHTML(query)}">
        <svg class="tk-history-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="tk-history-text">${escapeHTML(query)}</span>
        <button class="tk-history-remove" data-query="${escapeHTML(query)}" title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `).join('');

    emptyState.style.display = 'none';
    historySection.style.display = 'block';

    bindHistoryEvents();
  }

  // 绑定历史记录事件
  function bindHistoryEvents() {
    const items = historyList.querySelectorAll('.tk-search-history-item');
    items.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.tk-history-remove')) {
          return;
        }
        const query = item.dataset.query;
        if (query) {
          input.value = query;
          performSearch(query);
        }
      });

      item.addEventListener('mouseenter', () => {
        currentSelectedIndex = index;
        updateSelection(items);
      });

      const removeBtn = item.querySelector('.tk-history-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const query = removeBtn.dataset.query;
          removeSearchHistory(query);
          loadSearchHistory();
        });
      }
    });
  }

  // 显示历史记录或空状态
  function showHistoryOrEmpty() {
    hideAllStates();
    currentResults = [];
    currentSelectedIndex = -1;
    loadSearchHistory();
  }

  // 显示加载状态
  function showLoading() {
    hideAllStates();
    loadingState.style.display = 'flex';
  }

  // 显示无结果
  function showNoResults() {
    hideAllStates();
    noResultsState.style.display = 'flex';
  }

  // 显示错误
  function showError() {
    hideAllStates();
    noResultsState.style.display = 'flex';
    const text = noResultsState.querySelector('.tk-search-empty-text');
    if (text) {
      text.textContent = '搜索出错，请稍后再试';
    }
  }

  // 隐藏所有状态
  function hideAllStates() {
    emptyState.style.display = 'none';
    historySection.style.display = 'none';
    resultsSection.style.display = 'none';
    loadingState.style.display = 'none';
    noResultsState.style.display = 'none';
  }

  // 打开模态框
  async function openModal() {
    if (!modal) return;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // 🚀 懒加载：首次点击时从 localStorage/网络加载索引
    if (flexSearch && !flexSearch.initialized && !flexSearch.initializing) {
      console.log('[Search] 首次打开，开始加载搜索索引...');
      showLoading(); // 显示加载状态

      try {
        const success = await flexSearch.init();
        if (!success) {
          console.error('[Search] 索引加载失败');
          showError();
          return;
        }
        console.log('[Search] ✅ 搜索索引加载完成');
      } catch (err) {
        console.error('[Search] 索引加载出错:', err);
        showError();
        return;
      }
    }

    setTimeout(() => {
      if (input) {
        input.focus();
      }
    }, 100);

    showHistoryOrEmpty();
    console.log('[Search] Modal opened');
  }

  // 关闭模态框
  function closeModal() {
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';

    if (input) {
      input.value = '';
    }

    hideAllStates();
    currentResults = [];
    currentSelectedIndex = -1;

    console.log('[Search] Modal closed');
  }

  // 获取搜索历史
  function getSearchHistory() {
    try {
      const history = localStorage.getItem(STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('[Search] Failed to load search history:', e);
      return [];
    }
  }

  // 保存搜索历史
  function saveSearchHistory(query) {
    try {
      let history = getSearchHistory();
      history = history.filter(q => q !== query);
      history.unshift(query);
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('[Search] Failed to save search history:', e);
    }
  }

  // 删除搜索历史项
  function removeSearchHistory(query) {
    try {
      let history = getSearchHistory();
      history = history.filter(q => q !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('[Search] Failed to remove search history:', e);
    }
  }

  // 工具函数：转义 HTML
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 暴露全局函数
  window.initSearch = init;

  // 初始化
  init();

  console.log('[Search] FlexSearch 搜索模块已加载');
})();
