// 归档页面懒加载功能
(function() {
  console.log('[Archives] Lazy load script loaded');

  const POSTS_PER_PAGE = 20;  // 每页加载20篇
  let currentIndex = 0;
  let isLoading = false;
  let allYearMonthGroups = [];  // 存储按年月分组的数据结构

  // 获取时间轴容器
  const timeline = document.getElementById('archivesTimeline');
  if (!timeline) {
    console.error('[Archives] Timeline container not found');
    return;
  }

  // 检查数据是否存在
  if (!window.archivesData || !window.archivesData.posts) {
    console.error('[Archives] No posts data found');
    timeline.innerHTML = '<div class="archives-no-data">暂无文章数据</div>';
    return;
  }

  const allPosts = window.archivesData.posts;
  console.log('[Archives] Total posts:', allPosts.length);

  // 按年月分组文章
  function groupPostsByYearMonth() {
    const yearGroups = {};

    allPosts.forEach(post => {
      if (!yearGroups[post.year]) {
        yearGroups[post.year] = {};
      }
      if (!yearGroups[post.year][post.month]) {
        yearGroups[post.year][post.month] = [];
      }
      yearGroups[post.year][post.month].push(post);
    });

    // 转换为数组结构，方便分页
    const groups = [];
    Object.keys(yearGroups).sort((a, b) => b - a).forEach(year => {
      const months = yearGroups[year];
      Object.keys(months).sort((a, b) => b - a).forEach(month => {
        groups.push({
          year: year,
          month: month,
          posts: months[month]
        });
      });
    });

    return groups;
  }

  // 渲染年份头部
  function renderYearHeader(year, yearPostsCount) {
    return `
      <div class="tk-archives__timeline--year">
        <div class="year">
          ${year}
          <span class="count">${yearPostsCount} 篇</span>
        </div>
      </div>
    `;
  }

  // 渲染月份和文章列表
  function renderMonthGroup(monthData) {
    const monthNum = parseInt(monthData.month);
    const postsHtml = monthData.posts.map(post => {
      // 兼容处理：确保 tags 始终是数组
      let tagsArray = [];
      if (post.tags) {
        if (typeof post.tags === 'string') {
          try {
            tagsArray = JSON.parse(post.tags);
          } catch (e) {
            console.warn('[Archives] Failed to parse tags:', post.tags);
            tagsArray = [];
          }
        } else if (Array.isArray(post.tags)) {
          tagsArray = post.tags;
        }
      }

      const tagsHtml = tagsArray.length > 0
        ? `<span class="tags">${tagsArray.map(tag => `<span class="tag">${tag}</span>`).join('')}</span>`
        : '';

      return `
        <li>
          <a href="${post.url}">
            <span class="date">${post.month}-${post.day}</span>
            <span class="title">${post.title}</span>
            ${tagsHtml}
          </a>
        </li>
      `;
    }).join('');

    return `
      <div class="tk-archives__timeline__m">
        <div class="tk-archives__timeline__m--month">
          <div class="month">
            <span class="month-name">${monthNum}月</span>
            <span class="count">${monthData.posts.length} 篇</span>
          </div>
        </div>
        <ul>${postsHtml}</ul>
      </div>
    `;
  }

  // 渲染一批文章
  function renderBatch(startIndex, endIndex) {
    const groupsToRender = allYearMonthGroups.slice(startIndex, endIndex);
    let html = '';
    let currentYear = null;

    groupsToRender.forEach((group, index) => {
      // 如果是新的年份，插入年份头部
      if (group.year !== currentYear) {
        currentYear = group.year;
        // 计算该年份在这批次中的文章总数
        const yearGroups = groupsToRender.filter(g => g.year === currentYear);
        const yearPostsCount = yearGroups.reduce((sum, g) => sum + g.posts.length, 0);
        html += renderYearHeader(currentYear, yearPostsCount);
      }

      // 渲染月份组
      html += renderMonthGroup(group);
    });

    return html;
  }

  // 加载更多
  function loadMore() {
    if (isLoading || currentIndex >= allYearMonthGroups.length) {
      return;
    }

    isLoading = true;
    console.log('[Archives] Loading batch:', currentIndex, '-', Math.min(currentIndex + POSTS_PER_PAGE, allYearMonthGroups.length));

    // 移除加载提示
    const loadingEl = timeline.querySelector('.archives-loading');
    if (loadingEl) {
      loadingEl.remove();
    }

    // 计算要加载的组
    const nextIndex = Math.min(currentIndex + POSTS_PER_PAGE, allYearMonthGroups.length);
    const html = renderBatch(currentIndex, nextIndex);

    // 插入HTML
    timeline.insertAdjacentHTML('beforeend', html);

    currentIndex = nextIndex;
    isLoading = false;

    // 如果已加载完所有文章
    if (currentIndex >= allYearMonthGroups.length) {
      console.log('[Archives] All posts loaded');
      timeline.insertAdjacentHTML('beforeend', '<div class="archives-no-more">已加载全部文章</div>');
      window.removeEventListener('scroll', checkScroll);
    }
  }

  // 检查是否需要加载更多
  function checkScroll() {
    if (isLoading) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 距离底部 800px 时触发加载
    if (scrollTop + windowHeight >= documentHeight - 800) {
      loadMore();
    }
  }

  // 初始化
  function init() {
    // 按年月分组
    allYearMonthGroups = groupPostsByYearMonth();
    console.log('[Archives] Year-month groups:', allYearMonthGroups.length);

    // 清空容器
    timeline.innerHTML = '';

    // 加载第一批
    loadMore();

    // 监听滚动
    window.addEventListener('scroll', checkScroll);

    // 页面卸载时移除监听
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('scroll', checkScroll);
    });
  }

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
