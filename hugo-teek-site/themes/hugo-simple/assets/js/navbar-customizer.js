/**
 * 导航栏自定义器
 * 允许用户动态调整导航栏样式
 */
(function() {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
        brandFontSize: '1.3rem',
        brandFontWeight: 'bold',
        linkFontSize: '0.95rem',
        linkFontWeight: 'normal',
        linkColor: '',
        linkHoverColor: '',
        linkColorDark: '',
        linkHoverColorDark: '',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backgroundColorDark: 'rgba(15, 23, 42, 0.8)',
        fontFamily: ''
    };

    const STORAGE_KEY = 'navbarConfig';

    /**
     * 初始化导航栏自定义
     */
    function initNavbarCustomizer() {
        loadSavedConfig();
    }

    /**
     * 应用配置
     */
    function applyConfig(config) {
        const root = document.documentElement;
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        // 设置CSS变量
        if (mergedConfig.brandFontSize) {
            root.style.setProperty('--navbar-brand-size', mergedConfig.brandFontSize);
            root.setAttribute('data-navbar-brand-size', '');
        }

        if (mergedConfig.brandFontWeight) {
            root.style.setProperty('--navbar-brand-weight', mergedConfig.brandFontWeight);
            root.setAttribute('data-navbar-brand-weight', '');
        }

        if (mergedConfig.linkFontSize) {
            root.style.setProperty('--navbar-link-size', mergedConfig.linkFontSize);
            root.setAttribute('data-navbar-link-size', '');
        }

        if (mergedConfig.linkFontWeight) {
            root.style.setProperty('--navbar-link-weight', mergedConfig.linkFontWeight);
            root.setAttribute('data-navbar-link-weight', '');
        }

        if (mergedConfig.linkColor) {
            root.style.setProperty('--navbar-link-color', mergedConfig.linkColor);
            root.setAttribute('data-navbar-link-color', '');
        }

        if (mergedConfig.linkHoverColor) {
            root.style.setProperty('--navbar-link-hover-color', mergedConfig.linkHoverColor);
        }

        if (mergedConfig.linkColorDark) {
            root.style.setProperty('--navbar-link-color-dark', mergedConfig.linkColorDark);
            root.setAttribute('data-navbar-link-color-dark', '');
        }

        if (mergedConfig.linkHoverColorDark) {
            root.style.setProperty('--navbar-link-hover-color-dark', mergedConfig.linkHoverColorDark);
        }

        if (mergedConfig.backgroundColor) {
            root.style.setProperty('--navbar-bg', mergedConfig.backgroundColor);
            root.setAttribute('data-navbar-bg', '');
        }

        if (mergedConfig.backgroundColorDark) {
            root.style.setProperty('--navbar-bg-dark', mergedConfig.backgroundColorDark);
            root.setAttribute('data-navbar-bg-dark', '');
        }

        if (mergedConfig.fontFamily) {
            root.style.setProperty('--navbar-font-family', mergedConfig.fontFamily);
            root.setAttribute('data-navbar-font-family', '');
        }
    }

    /**
     * 保存配置
     */
    function saveConfig(config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        applyConfig(config);
    }

    /**
     * 加载保存的配置
     */
    function loadSavedConfig() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const config = JSON.parse(saved);
                applyConfig(config);
            }
        } catch (e) {
            console.error('Failed to load navbar config:', e);
        }
    }

    /**
     * 重置为默认配置
     */
    function resetConfig() {
        localStorage.removeItem(STORAGE_KEY);
        applyConfig(DEFAULT_CONFIG);
    }

    // 暴露API到全局（用于控制台或配置面板）
    window.navbarCustomizer = {
        apply: applyConfig,
        save: saveConfig,
        reset: resetConfig,
        getDefault: () => ({ ...DEFAULT_CONFIG })
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbarCustomizer);
    } else {
        initNavbarCustomizer();
    }
})();
