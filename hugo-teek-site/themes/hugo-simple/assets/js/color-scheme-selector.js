/**
 * 配色方案选择器
 * 仿照暗黑模式实现，提供5种配色方案动态切换
 */
(function() {
    'use strict';

    // 配色方案定义
    const COLOR_SCHEMES = [
        { id: 'scheme1', name: '纯白/黑', icon: '⚪', desc: '高对比度' },
        { id: 'scheme2', name: '暖色调', icon: '🟠', desc: '米色/深棕' },
        { id: 'scheme3', name: '冷色调', icon: '🔵', desc: '淡蓝/深蓝' },
        { id: 'scheme4', name: '护眼色', icon: '🟢', desc: '淡绿/深灰绿' },
        { id: 'scheme5', name: '默认色', icon: '⚫', desc: '浅灰蓝/深灰蓝' }
    ];

    const DEFAULT_SCHEME = 'scheme5';
    const STORAGE_KEY = 'colorScheme';

    /**
     * 初始化配色方案选择器
     */
    function initColorSchemeSelector() {
        createSelectorUI();
        loadSavedScheme();
    }

    /**
     * 创建选择器UI
     */
    function createSelectorUI() {
        const navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'color-scheme-selector';
        container.style.cssText = `
            position: relative;
            display: inline-block;
        `;

        // 创建触发按钮
        const trigger = document.createElement('button');
        trigger.className = 'btn btn-outline btn-sm color-scheme-trigger';
        trigger.innerHTML = '🎨';
        trigger.setAttribute('aria-label', '选择配色方案');
        trigger.style.cssText = `
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

        // 创建下拉菜单
        const dropdown = document.createElement('div');
        dropdown.className = 'color-scheme-dropdown';
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            overflow: hidden;
        `;

        // 添加配色方案选项
        COLOR_SCHEMES.forEach(scheme => {
            const option = document.createElement('button');
            option.className = 'color-scheme-option';
            option.dataset.scheme = scheme.id;
            option.innerHTML = `
                <span style="font-size: 1.2rem; margin-right: 8px;">${scheme.icon}</span>
                <span style="flex: 1; text-align: left;">
                    <strong>${scheme.name}</strong><br>
                    <small style="color: var(--text-secondary); font-size: 0.85rem;">${scheme.desc}</small>
                </span>
            `;
            option.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                padding: 0.75rem 1rem;
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-family: inherit;
            `;

            option.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--bg-card)';
            });

            option.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });

            option.addEventListener('click', function() {
                setColorScheme(scheme.id);
                dropdown.style.display = 'none';
            });

            dropdown.appendChild(option);
        });

        // 切换下拉菜单显示
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', function() {
            dropdown.style.display = 'none';
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);

        // 插入到导航栏（在主题切换按钮之前）
        const themeToggle = navRight.querySelector('.btn'); // 主题切换按钮
        if (themeToggle) {
            navRight.insertBefore(container, themeToggle);
        } else {
            navRight.appendChild(container);
        }
    }

    /**
     * 设置配色方案
     */
    function setColorScheme(schemeId) {
        document.documentElement.setAttribute('data-color-scheme', schemeId);
        localStorage.setItem(STORAGE_KEY, schemeId);

        // 更新选中状态
        document.querySelectorAll('.color-scheme-option').forEach(option => {
            if (option.dataset.scheme === schemeId) {
                option.style.backgroundColor = 'var(--primary-light)';
            } else {
                option.style.backgroundColor = 'transparent';
            }
        });
    }

    /**
     * 加载保存的配色方案
     */
    function loadSavedScheme() {
        const savedScheme = localStorage.getItem(STORAGE_KEY) || DEFAULT_SCHEME;
        setColorScheme(savedScheme);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initColorSchemeSelector);
    } else {
        initColorSchemeSelector();
    }
})();
