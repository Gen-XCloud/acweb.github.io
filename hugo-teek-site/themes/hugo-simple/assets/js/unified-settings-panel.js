/**
 * 统一设置面板
 * 合并配色方案和导航栏设置为单一界面
 */
(function() {
    'use strict';

    // 配色方案定义 - 与 color-scheme-selector.js 保持一致
    const COLOR_SCHEMES = [
        { id: 'scheme1', name: '纯白/黑', swatch: '#808080' },
        { id: 'scheme2', name: '暖色调', swatch: '#d4a574' },
        { id: 'scheme3', name: '冷色调', swatch: '#7fa8c8' },
        { id: 'scheme4', name: '护眼色', swatch: '#a8c9a0' },
        { id: 'scheme5', name: '默认色', swatch: '#8e9db6' }
    ];

    // 字体选项
    const FONT_OPTIONS = [
        { value: '', label: '默认' },
        { value: "'Helvetica Neue', Arial, sans-serif", label: 'Helvetica' },
        { value: "'Georgia', serif", label: 'Georgia' },
        { value: "'Courier New', monospace", label: 'Courier' },
        { value: "'Arial', sans-serif", label: 'Arial' },
        { value: "'Times New Roman', serif", label: 'Times' },
        { value: "'SimSun', '宋体', serif", label: '宋体' },
        { value: "'Microsoft YaHei', '微软雅黑', sans-serif", label: '雅黑' }
    ];

    // 字体大小范围
    const FONT_SIZE = {
        MIN: 50,
        MAX: 150,
        STEP: 10,
        DEFAULT: 100
    };

    // 默认配置
    const DEFAULT_SETTINGS = {
        colorScheme: 'scheme5',
        fontSizeScale: 100,      // 字体大小百分比
        fontFamily: ''           // 字体类型
    };

    const STORAGE_KEY = 'unifiedSettings';
    const OLD_COLOR_SCHEME_KEY = 'colorScheme';
    const OLD_NAVBAR_CONFIG_KEY = 'navbarConfig';

    /**
     * 迁移旧 localStorage 数据到新格式
     */
    function migrateOldSettings() {
        // 检查是否已经有新格式数据
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
            return; // 已迁移，跳过
        }

        const migrated = { ...DEFAULT_SETTINGS };
        let needsMigration = false;

        // 迁移配色方案
        const oldColorScheme = localStorage.getItem(OLD_COLOR_SCHEME_KEY);
        if (oldColorScheme) {
            migrated.colorScheme = oldColorScheme;
            needsMigration = true;
        }

        // 导航栏配置不再迁移（fontSizeScale 保持默认 100%）

        // 保存迁移后的数据
        if (needsMigration) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            console.log('Settings migrated to unified format:', migrated);
        }

        // 保留旧 key（向后兼容）
    }

    /**
     * 加载设置
     */
    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * 保存设置
     */
    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    /**
     * 应用设置到页面
     */
    function applySettings(settings) {
        const root = document.documentElement;

        // 应用配色方案
        root.setAttribute('data-color-scheme', settings.colorScheme);

        // 应用全局字体大小缩放
        const scale = settings.fontSizeScale / 100;
        root.style.setProperty('--font-size-scale', scale);

        // 应用字体类型
        if (settings.fontFamily) {
            root.style.setProperty('--font-family-base', settings.fontFamily);
        } else {
            root.style.removeProperty('--font-family-base');
        }
    }

    /**
     * 创建统一设置面板 UI
     */
    function createUnifiedPanel() {
        const navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'unified-settings-container';
        container.style.cssText = `
            position: relative;
            display: inline-block;
        `;

        // 创建触发按钮（字母 "A"）
        const trigger = document.createElement('button');
        trigger.className = 'btn btn-outline btn-sm unified-settings-trigger';
        trigger.innerHTML = 'A';
        trigger.setAttribute('aria-label', '文字设置');
        trigger.style.cssText = `
            padding: 0.5rem;
            min-width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            cursor: pointer;
            transition: all var(--transition-fast);
        `;

        // 创建设置面板
        const panel = document.createElement('div');
        panel.className = 'unified-settings-panel';
        panel.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            min-width: 320px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            padding: 1rem;
        `;

        // 面板标题行（带关闭按钮）
        const titleRow = document.createElement('div');
        titleRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
        `;

        const title = document.createElement('h3');
        title.textContent = '文字设置';
        title.style.cssText = `
            margin: 0;
            font-size: 1.1rem;
            color: var(--text-primary);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        `;
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            panel.style.display = 'none';
        });
        closeBtn.addEventListener('mouseenter', function() {
            this.style.color = 'var(--text-primary)';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.color = 'var(--text-secondary)';
        });

        titleRow.appendChild(title);
        titleRow.appendChild(closeBtn);
        panel.appendChild(titleRow);

        // 字体大小控制
        const fontSizeSection = createFontSizeControl();
        panel.appendChild(fontSizeSection);

        // 配色方案
        const colorSchemeSection = createColorSchemeControl();
        panel.appendChild(colorSchemeSection);

        // 字体类型
        const fontFamilySection = createFontFamilyControl();
        panel.appendChild(fontFamilySection);

        // 底部按钮组
        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        `;

        // 重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置默认';
        resetBtn.style.cssText = `
            flex: 1;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            cursor: pointer;
            transition: background-color 0.2s;
        `;
        resetBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            resetToDefaults();
        });
        resetBtn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--bg-card)';
        });
        resetBtn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'var(--bg-secondary)';
        });

        // 关闭按钮
        const closeBtn2 = document.createElement('button');
        closeBtn2.textContent = '关闭';
        closeBtn2.style.cssText = `
            flex: 1;
            padding: 0.5rem;
            border: 1px solid var(--primary);
            border-radius: 4px;
            background: var(--primary);
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
        `;
        closeBtn2.addEventListener('click', function(e) {
            e.stopPropagation();
            panel.style.display = 'none';
        });
        closeBtn2.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        closeBtn2.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });

        buttonGroup.appendChild(resetBtn);
        buttonGroup.appendChild(closeBtn2);
        panel.appendChild(buttonGroup);

        // 切换面板显示
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        });

        // 点击外部关闭面板
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                panel.style.display = 'none';
            }
        });

        // 阻止面板内点击事件冒泡
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        container.appendChild(trigger);
        container.appendChild(panel);

        // 插入到导航栏（在主题切换按钮之前）
        const themeToggle = navRight.querySelector('.btn');
        if (themeToggle) {
            navRight.insertBefore(container, themeToggle);
        } else {
            navRight.appendChild(container);
        }
    }

    /**
     * 创建字体大小控制
     */
    function createFontSizeControl() {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 1rem;';

        const label = document.createElement('label');
        label.textContent = '字体大小';
        label.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            font-weight: 500;
        `;

        const controlRow = document.createElement('div');
        controlRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        `;

        // A- 按钮
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = 'A';
        decreaseBtn.style.cssText = `
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: bold;
            transition: all 0.2s;
        `;
        decreaseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            changeFontSize(-FONT_SIZE.STEP);
        });

        // 百分比显示
        const percentDisplay = document.createElement('span');
        percentDisplay.id = 'font-size-percent';
        percentDisplay.style.cssText = `
            min-width: 50px;
            text-align: center;
            color: var(--text-primary);
            font-weight: 500;
        `;
        updatePercentDisplay(percentDisplay);

        // A+ 按钮
        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = 'A';
        increaseBtn.style.cssText = `
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: 1.15rem;
            font-weight: bold;
            transition: all 0.2s;
        `;
        increaseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            changeFontSize(FONT_SIZE.STEP);
        });

        // 悬停效果
        [decreaseBtn, increaseBtn].forEach(function(btn) {
            btn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--bg-card)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'var(--bg-primary)';
            });
        });

        controlRow.appendChild(decreaseBtn);
        controlRow.appendChild(percentDisplay);
        controlRow.appendChild(increaseBtn);

        section.appendChild(label);
        section.appendChild(controlRow);
        return section;
    }

    /**
     * 更新百分比显示
     */
    function updatePercentDisplay(element) {
        if (!element) {
            element = document.getElementById('font-size-percent');
        }
        if (element) {
            const settings = loadSettings();
            element.textContent = settings.fontSizeScale + '%';
        }
    }

    /**
     * 改变字体大小
     */
    function changeFontSize(delta) {
        const settings = loadSettings();
        let newScale = settings.fontSizeScale + delta;

        // 限制范围
        newScale = Math.max(FONT_SIZE.MIN, Math.min(FONT_SIZE.MAX, newScale));

        if (newScale !== settings.fontSizeScale) {
            settings.fontSizeScale = newScale;
            saveSettings(settings);
            applySettings(settings);
            updatePercentDisplay();
        }
    }

    /**
     * 创建配色方案控制
     */
    function createColorSchemeControl() {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 1rem;';

        const label = document.createElement('label');
        label.textContent = '配色方案';
        label.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            font-weight: 500;
        `;

        const swatchRow = document.createElement('div');
        swatchRow.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 1rem;
        `;

        COLOR_SCHEMES.forEach(function(scheme) {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.dataset.scheme = scheme.id;
            swatch.setAttribute('aria-label', scheme.name);
            swatch.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: ${scheme.swatch};
                border: 2px solid var(--border-color);
                cursor: pointer;
                transition: all 0.2s;
                padding: 0;
            `;

            swatch.addEventListener('click', function(e) {
                e.stopPropagation();
                setColorScheme(scheme.id);
            });

            swatch.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = 'scale(1.1)';
                }
            });

            swatch.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.transform = 'scale(1)';
                }
            });

            swatchRow.appendChild(swatch);
        });

        section.appendChild(label);
        section.appendChild(swatchRow);
        updateColorSchemeSelection();
        return section;
    }

    /**
     * 设置配色方案
     */
    function setColorScheme(schemeId) {
        const settings = loadSettings();
        settings.colorScheme = schemeId;
        saveSettings(settings);
        applySettings(settings);
        updateColorSchemeSelection();
    }

    /**
     * 更新配色方案选中状态
     */
    function updateColorSchemeSelection() {
        const settings = loadSettings();
        document.querySelectorAll('.color-swatch').forEach(function(swatch) {
            const isActive = swatch.dataset.scheme === settings.colorScheme;
            swatch.classList.toggle('active', isActive);

            if (isActive) {
                swatch.style.borderWidth = '3px';
                swatch.style.borderColor = 'var(--primary)';
                swatch.style.boxShadow = '0 0 8px var(--primary)';
            } else {
                swatch.style.borderWidth = '2px';
                swatch.style.borderColor = 'var(--border-color)';
                swatch.style.boxShadow = 'none';
            }
        });
    }

    /**
     * 创建字体类型控制
     */
    function createFontFamilyControl() {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 1rem;';

        const label = document.createElement('label');
        label.textContent = '字体类型';
        label.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            font-weight: 500;
        `;

        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
        `;

        // 响应式：移动端单列
        const mediaQuery = window.matchMedia('(max-width: 480px)');
        function handleMediaChange(e) {
            grid.style.gridTemplateColumns = e.matches ? '1fr' : 'repeat(4, 1fr)';
        }
        handleMediaChange(mediaQuery);
        mediaQuery.addListener(handleMediaChange);

        FONT_OPTIONS.forEach(function(font) {
            const btn = document.createElement('button');
            btn.className = 'font-option';
            btn.dataset.value = font.value;
            btn.textContent = font.label;
            btn.style.cssText = `
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-primary);
                color: var(--text-primary);
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
                text-align: center;
            `;

            // 应用字体自身（预览效果）
            if (font.value) {
                btn.style.fontFamily = font.value;
            }

            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                setFontFamily(font.value);
            });

            btn.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = 'var(--bg-card)';
                }
            });

            btn.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = 'var(--bg-primary)';
                }
            });

            grid.appendChild(btn);
        });

        section.appendChild(label);
        section.appendChild(grid);
        updateFontFamilySelection();
        return section;
    }

    /**
     * 设置字体类型
     */
    function setFontFamily(fontValue) {
        const settings = loadSettings();
        settings.fontFamily = fontValue;
        saveSettings(settings);
        applySettings(settings);
        updateFontFamilySelection();
    }

    /**
     * 更新字体类型选中状态
     */
    function updateFontFamilySelection() {
        const settings = loadSettings();
        document.querySelectorAll('.font-option').forEach(function(btn) {
            const isActive = btn.dataset.value === settings.fontFamily;
            btn.classList.toggle('active', isActive);

            if (isActive) {
                btn.style.backgroundColor = 'var(--primary-light)';
                btn.style.borderColor = 'var(--primary)';
            } else {
                btn.style.backgroundColor = 'var(--bg-primary)';
                btn.style.borderColor = 'var(--border-color)';
            }
        });
    }

    /**
     * 重置为默认设置
     */
    function resetToDefaults() {
        localStorage.removeItem(STORAGE_KEY);
        const settings = { ...DEFAULT_SETTINGS };
        saveSettings(settings);
        applySettings(settings);

        // 更新 UI
        updatePercentDisplay();
        updateColorSchemeSelection();
        updateFontFamilySelection();
    }

    /**
     * 初始化统一设置面板
     */
    function initUnifiedSettingsPanel() {
        // 执行迁移
        migrateOldSettings();

        // 加载并应用设置
        const settings = loadSettings();
        applySettings(settings);

        // 创建 UI
        createUnifiedPanel();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnifiedSettingsPanel);
    } else {
        initUnifiedSettingsPanel();
    }

    // 暴露 API（用于调试和扩展）
    window.unifiedSettings = {
        load: loadSettings,
        save: saveSettings,
        apply: applySettings,
        reset: resetToDefaults,
        migrate: migrateOldSettings
    };
})();
