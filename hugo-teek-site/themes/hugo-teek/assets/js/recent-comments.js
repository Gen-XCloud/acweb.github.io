/**
 * 最新评论功能（支持翻页）
 * 在首页展示最近的 Twikoo 评论
 */
(function() {
  'use strict';

  let allComments = [];      // 所有评论
  let currentPage = 1;       // 当前页码
  let pageSize = 5;          // 每页显示数量
  let totalPages = 1;        // 总页数
  let isAnimating = false;   // 动画状态标记（参考友链卡片）
  let isInitialized = false; // 是否已初始化（参考友链卡片）

  // 等待 Twikoo 和 DOM 加载完成
  function init() {
    const commentsList = document.getElementById('recent-comments-list');
    if (!commentsList) return;

    const configEl = document.getElementById('recent-comments-config');
    if (!configEl) {
      console.error('[RecentComments] Config not found');
      return;
    }

    let config;
    try {
      config = JSON.parse(configEl.textContent);
    } catch (e) {
      console.error('[RecentComments] Invalid config:', e);
      return;
    }

    pageSize = config.pageSize || 5;

    // 等待 Twikoo 加载
    waitForTwikoo(() => {
      loadRecentComments(config, commentsList);
    });
  }

  // 等待 Twikoo 库加载
  function waitForTwikoo(callback) {
    if (typeof twikoo !== 'undefined' && twikoo.getRecentComments) {
      callback();
    } else {
      setTimeout(() => waitForTwikoo(callback), 100);
    }
  }

  // 加载最新评论
  function loadRecentComments(config, container) {
    console.log('[RecentComments] Loading comments...');

    twikoo.getRecentComments({
      envId: config.envId,
      pageSize: config.totalSize || 50,  // 一次性获取更多评论
      includeReply: true
    }).then(res => {
      if (res && res.length > 0) {
        allComments = res;
        totalPages = Math.ceil(allComments.length / pageSize);
        currentPage = 1;

        // 如果总页数不超过 1，让容器高度自适应（参考友链卡片）
        if (totalPages <= 1) {
          container.classList.add('auto-height');
        } else {
          container.classList.remove('auto-height');
        }

        renderPage(container, false); // 初始加载不执行动画
        setupPagination();
      } else {
        showEmpty(container);
      }
    }).catch(err => {
      console.error('[RecentComments] Load error:', err);
      showError(container);
    });
  }

  // 渲染当前页（参考友链卡片添加动画效果）
  function renderPage(container, animate = true) {
    // 如果正在动画，忽略此次请求
    if (isAnimating && animate) {
      return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageComments = allComments.slice(start, end);

    // 获取当前显示的评论项
    const currentItems = Array.from(container.querySelectorAll('.comment-item'));

    // 如果是初始加载或不需要动画，直接显示无动画
    if (!animate || currentItems.length === 0 || !isInitialized) {
      renderComments(pageComments, container);
      updatePaginationState();
      if (!isInitialized) {
        isInitialized = true;
      }
      return;
    }

    // 设置动画状态
    isAnimating = true;

    // 第一步 - 为旧元素添加 animating 类，使其绝对定位
    const containerWidth = container.offsetWidth;
    currentItems.forEach((item, index) => {
      item.classList.add('animating');
      item.style.width = `${containerWidth}px`;
      item.style.maxWidth = '100%';
      // 动态获取每个元素的实际高度，精确定位
      let topPosition = 0;
      for (let j = 0; j < index; j++) {
        topPosition += currentItems[j].offsetHeight + 0; // 0px gap (comments-list已经有gap)
      }
      item.style.top = `${topPosition}px`;
    });

    // 第二步 - 渲染新评论（透明状态）
    renderComments(pageComments, container);
    const newItems = Array.from(container.querySelectorAll('.comment-item:not(.animating)'));
    newItems.forEach(item => {
      item.classList.add('fade-in-prepare');
    });

    // 第三步 - 下一帧同时执行淡入淡出
    requestAnimationFrame(() => {
      // 旧元素淡出
      currentItems.forEach(item => {
        item.classList.add('fade-out');
      });

      // 新元素淡入（带层叠延迟）
      newItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.remove('fade-in-prepare');
          item.classList.add('fade-in');
        }, index * 35); // 每项延迟 35ms
      });
    });

    // 第四步 - 动画结束后清理
    const animationDuration = 220 + newItems.length * 35;
    setTimeout(() => {
      // 移除旧元素
      currentItems.forEach(item => {
        if (item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });

      // 清除新元素的动画类
      newItems.forEach(item => {
        item.classList.remove('fade-in', 'fade-in-prepare');
        item.style.width = '';
        item.style.maxWidth = '';
        item.style.top = '';
      });

      isAnimating = false;
      updatePaginationState();
    }, animationDuration);
  }

  // 设置翻页按钮
  function setupPagination() {
    const pagination = document.getElementById('recent-comments-pagination');
    const prevBtn = document.getElementById('comments-prev-btn');
    const nextBtn = document.getElementById('comments-next-btn');

    if (!pagination || !prevBtn || !nextBtn) return;

    // 只有多于一页时才显示翻页
    if (totalPages > 1) {
      pagination.style.display = 'flex';
    }

    // 上一页（支持循环翻页，参考友链卡片）
    prevBtn.addEventListener('click', () => {
      if (isAnimating) return; // 动画中忽略点击
      currentPage--;
      if (currentPage < 1) {
        currentPage = totalPages; // 循环到最后一页
      }
      const container = document.getElementById('recent-comments-list');
      renderPage(container, true);
    });

    // 下一页（支持循环翻页，参考友链卡片）
    nextBtn.addEventListener('click', () => {
      if (isAnimating) return; // 动画中忽略点击
      currentPage++;
      if (currentPage > totalPages) {
        currentPage = 1; // 循环到第一页
      }
      const container = document.getElementById('recent-comments-list');
      renderPage(container, true);
    });
  }

  // 更新翻页状态（参考友链卡片，移除disabled状态，支持循环翻页）
  function updatePaginationState() {
    // 不需要更新按钮状态，因为支持循环翻页
    // 友链卡片也没有页码显示
  }

  // 渲染评论列表
  function renderComments(comments, container) {
    const html = comments.map(comment => {
      const avatar = comment.avatar || 'https://cravatar.cn/avatar/d41d8cd98f00b204e9800998ecf8427e?d=mp';
      const nick = escapeHtml(comment.nick || '匿名');
      const content = escapeHtml(truncateText(stripHtml(comment.comment), 50));
      const timeAgo = formatTimeAgo(comment.created);
      const url = comment.url || '#';

      return `
        <a href="${url}" class="comment-item" target="_blank" rel="noopener">
          <img src="${avatar}" alt="${nick}" class="comment-avatar" loading="lazy">
          <div class="comment-content">
            <div class="comment-text">${content}</div>
            <div class="comment-meta">
              <span class="comment-author">${nick}</span>
              <span class="comment-divider">/</span>
              <span class="comment-time">${timeAgo}</span>
            </div>
          </div>
        </a>
      `;
    }).join('');

    container.innerHTML = html;
  }

  // 显示空状态
  function showEmpty(container) {
    container.innerHTML = `
      <div class="comments-empty">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>还没有评论</span>
      </div>
    `;
  }

  // 显示错误状态
  function showError(container) {
    container.innerHTML = `
      <div class="comments-error">
        <span>加载失败</span>
      </div>
    `;
  }

  // 工具函数：转义 HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 工具函数：移除 HTML 标签
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // 工具函数：截断文本
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // 工具函数：格式化时间
  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const past = new Date(timestamp).getTime();
    const diff = now - past;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前';
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前';
    } else if (diff < month) {
      return Math.floor(diff / (7 * day)) + '周前';
    } else {
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
