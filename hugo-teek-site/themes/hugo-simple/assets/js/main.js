/**
 * Hugo Simple Theme - Main JavaScript
 * Adapted from Baimu (白木) template
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        initThemeToggle();
        initSearch();
        initNavigation();
        initCardHover();
        // initRandomBanner();  // 已禁用随机轮播，Hero 使用固定背景图
        initNavbarAutoHide();
        initCustomBlockDetails();
    });

    /**
     * 暗黑模式切换
     * 创建切换按钮并添加到导航栏右侧
     * 使用 LocalStorage 持久化主题设置
     */
    function initThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'btn btn-outline btn-sm';
        themeToggle.innerHTML = '🌙';
        themeToggle.setAttribute('aria-label', '切换主题');
        themeToggle.style.cssText = `
            padding: 0.5rem;
            min-width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            cursor: pointer;
            transition: all var(--transition-fast);
        `;

        const navRight = document.querySelector('.nav-right');
        if (navRight) {
            navRight.appendChild(themeToggle);
        }

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme, themeToggle);

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme, themeToggle);
        });
    }

    function updateThemeIcon(theme, button) {
        button.innerHTML = theme === 'light' ? '🌙' : '☀️';
        button.setAttribute('title', theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式');
    }

    /**
     * 实时搜索功能
     * 300ms 防抖，按标题、分类和摘要过滤文章
     */
    function initSearch() {
        const searchInput = document.getElementById('search-input');

        if (searchInput) {
            let searchTimeout;

            searchInput.addEventListener('input', function(e) {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.toLowerCase().trim();

                searchTimeout = setTimeout(function() {
                    filterArticles(searchTerm);
                }, 300);
            });

            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = e.target.value.toLowerCase().trim();
                    filterArticles(searchTerm);
                }
            });
        }
    }

    function filterArticles(searchTerm) {
        const articles = document.querySelectorAll('article.article-card, article.card');
        let visibleCount = 0;

        articles.forEach(function(article) {
            const titleElem = article.querySelector('.card-title, .article-title');
            const categoryElem = article.querySelector('.meta-category');
            const excerptElem = article.querySelector('.article-excerpt, .card-body p');

            if (!titleElem) return;

            const title = titleElem.textContent.toLowerCase();
            const category = categoryElem ? categoryElem.textContent.toLowerCase() : '';
            const excerpt = excerptElem ? excerptElem.textContent.toLowerCase() : '';

            const matches = searchTerm === '' ||
                title.includes(searchTerm) ||
                category.includes(searchTerm) ||
                excerpt.includes(searchTerm);

            if (matches) {
                article.style.display = '';
                visibleCount++;
            } else {
                article.style.display = 'none';
            }
        });

        updateSearchResults(visibleCount, searchTerm);
    }

    function updateSearchResults(count, searchTerm) {
        let resultsMessage = document.getElementById('search-results');

        if (!resultsMessage) {
            resultsMessage = document.createElement('div');
            resultsMessage.id = 'search-results';
            resultsMessage.className = 'text-center text-secondary mb-lg';
            resultsMessage.style.cssText = `
                padding: 1rem;
                margin: 1rem 0;
                font-size: 0.95rem;
                color: var(--text-secondary);
            `;

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const firstChild = mainContent.firstElementChild;
                if (firstChild) {
                    mainContent.insertBefore(resultsMessage, firstChild.nextSibling);
                } else {
                    mainContent.appendChild(resultsMessage);
                }
            }
        }

        if (searchTerm) {
            resultsMessage.textContent = `找到 ${count} 篇关于 "${searchTerm}" 的文章`;
        } else {
            resultsMessage.textContent = '';
        }
    }

    /**
     * 随机 Banner 功能
     * 从 window.heroBannerImages 或 data-banner-images 属性获取图片列表
     */
    function initRandomBanner() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        let bannerImages = [];

        // 优先从 window 全局变量获取
        if (window.heroBannerImages && Array.isArray(window.heroBannerImages)) {
            bannerImages = window.heroBannerImages;
        }
        // 其次从 data 属性获取
        else if (hero.dataset.bannerImages) {
            bannerImages = hero.dataset.bannerImages.split(',').map(path => path.trim());
        }

        if (bannerImages.length === 0) {
            console.warn('未设置 Banner 图片列表');
            return;
        }

        // 随机选择一张图片
        const randomIndex = Math.floor(Math.random() * bannerImages.length);
        const randomImage = bannerImages[randomIndex];

        hero.style.backgroundImage = `url('${randomImage}')`;
    }

    /**
     * 导航激活状态
     */
    function initNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .site-nav a');

        navLinks.forEach(function(link) {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPath || (currentPath.startsWith(linkPath) && linkPath !== '/')) {
                link.classList.add('active');
                link.style.color = 'white';
            }
        });
    }

    /**
     * 文章卡片悬浮效果
     * 仅在桌面设备上启用（>768px）
     */
    function initCardHover() {
        if (window.innerWidth <= 768) return;

        const cards = document.querySelectorAll('.article-card, .card');

        cards.forEach(function(card) {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * 导航栏自动隐藏
     * 120 秒无操作后自动隐藏，鼠标悬浮或滚动时显示
     */
    function initNavbarAutoHide() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let hideTimeout;
        let isHidden = false;

        // 初始状态：导航栏可见
        header.classList.add('header-visible');

        // 120 秒后自动隐藏
        function startHideTimer() {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (!isHidden) {
                    header.classList.remove('header-visible');
                    header.classList.add('header-hidden');
                    isHidden = true;
                }
            }, 120000); // 120 秒
        }

        function showHeader() {
            clearTimeout(hideTimeout);
            if (isHidden) {
                header.classList.remove('header-hidden');
                header.classList.add('header-visible');
                isHidden = false;
            }
        }

        // 启动初始计时器
        startHideTimer();

        // 鼠标悬浮时显示
        header.addEventListener('mouseenter', () => {
            showHeader();
        });

        // 鼠标离开后重新计时
        header.addEventListener('mouseleave', () => {
            startHideTimer();
        });

        // 滚动时显示并重新计时
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            showHeader();

            scrollTimeout = setTimeout(() => {
                startHideTimer();
            }, 1000); // 滚动停止 1 秒后重新计时
        }, { passive: true });

        // 鼠标移动到顶部区域（100px 内）时显示
        document.addEventListener('mousemove', (e) => {
            if (e.clientY < 100) {
                showHeader();
            }
        }, { passive: true });
    }

    /**
     * 初始化 custom-block details 类型的折叠/展开功能
     */
    function initCustomBlockDetails() {
        const detailsBlocks = document.querySelectorAll('.custom-block.details');

        detailsBlocks.forEach(function(block) {
            const title = block.querySelector('.custom-block-title');
            if (!title) return;

            // 设置初始状态
            const collapsed = block.dataset.collapsed === 'true';
            if (!collapsed) {
                block.classList.add('expanded');
            }

            // 点击标题切换展开/折叠
            title.addEventListener('click', function() {
                block.classList.toggle('expanded');
            });
        });
    }

})();
