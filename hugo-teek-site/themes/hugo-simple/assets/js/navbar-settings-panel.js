/**
 * 导航栏设置面板
 * 提供可视化UI让用户自定义导航栏样式
 */
(function() {
    'use strict';

    // 字体选项
    const FONT_OPTIONS = [
        { value: '', label: '默认字体' },
        { value: "'Helvetica Neue', Arial, sans-serif", label: 'Helvetica' },
        { value: "'Georgia', serif", label: 'Georgia' },
        { value: "'Courier New', monospace", label: 'Courier' },
        { value: "'Arial', sans-serif", label: 'Arial' },
        { value: "'Times New Roman', serif", label: 'Times' }
    ];

    /**
     * 创建设置面板UI
     */
    function createSettingsPanel() {
        const navRight = document.querySelector('.nav-right');
        if (!navRight) return;

        // 创建容器
        const container = document.createElement('div');
        container.className = 'navbar-settings-container';
        container.style.cssText = `
            position: relative;
            display: inline-block;
        `;

        // 创建触发按钮（⚙️齿轮图标）
        const trigger = document.createElement('button');
        trigger.className = 'btn btn-outline btn-sm navbar-settings-trigger';
        trigger.innerHTML = '⚙️';
        trigger.setAttribute('aria-label', '导航栏设置');
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

        // 创建设置面板
        const panel = document.createElement('div');
        panel.className = 'navbar-settings-panel';
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

        // 面板标题
        const title = document.createElement('h3');
        title.textContent = '导航栏设置';
        title.style.cssText = `
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: var(--text-primary);
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
        `;
        panel.appendChild(title);

        // 品牌字体大小
        panel.appendChild(createSliderControl(
            'brand-font-size',
            '品牌字体大小',
            1,
            3,
            0.1,
            1.3,
            function(value) {
                return value + 'rem';
            }
        ));

        // 链接字体大小
        panel.appendChild(createSliderControl(
            'link-font-size',
            '链接字体大小',
            0.8,
            1.5,
            0.05,
            0.95,
            function(value) {
                return value + 'rem';
            }
        ));

        // 字体类型选择
        const fontFamilyGroup = document.createElement('div');
        fontFamilyGroup.style.cssText = 'margin-bottom: 1rem;';

        const fontLabel = document.createElement('label');
        fontLabel.textContent = '字体类型';
        fontLabel.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            font-weight: 500;
        `;

        const fontSelect = document.createElement('select');
        fontSelect.id = 'navbar-font-family';
        fontSelect.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.9rem;
        `;

        FONT_OPTIONS.forEach(function(option) {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            fontSelect.appendChild(opt);
        });

        fontSelect.addEventListener('change', function() {
            window.navbarCustomizer.save({ fontFamily: this.value });
        });

        fontFamilyGroup.appendChild(fontLabel);
        fontFamilyGroup.appendChild(fontSelect);
        panel.appendChild(fontFamilyGroup);

        // 按钮组
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
        resetBtn.addEventListener('click', function() {
            window.navbarCustomizer.reset();
            loadCurrentSettings();
            panel.style.display = 'none';
        });

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            flex: 1;
            padding: 0.5rem;
            border: 1px solid var(--primary);
            border-radius: 4px;
            background: var(--primary);
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
        `;
        closeBtn.addEventListener('click', function() {
            panel.style.display = 'none';
        });

        buttonGroup.appendChild(resetBtn);
        buttonGroup.appendChild(closeBtn);
        panel.appendChild(buttonGroup);

        // 切换面板显示
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // 点击外部关闭面板
        document.addEventListener('click', function() {
            panel.style.display = 'none';
        });

        container.appendChild(trigger);
        container.appendChild(panel);

        // 插入到导航栏（在配色方案选择器之后）
        const colorSchemeSelector = navRight.querySelector('.color-scheme-selector');
        if (colorSchemeSelector) {
            navRight.insertBefore(container, colorSchemeSelector.nextSibling);
        } else {
            navRight.appendChild(container);
        }
    }

    /**
     * 创建滑块控制
     */
    function createSliderControl(id, label, min, max, step, defaultValue, formatValue) {
        const group = document.createElement('div');
        group.style.cssText = 'margin-bottom: 1rem;';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-size: 0.9rem;
            font-weight: 500;
        `;

        const valueDisplay = document.createElement('span');
        valueDisplay.style.cssText = `
            float: right;
            color: var(--text-secondary);
            font-size: 0.85rem;
        `;
        valueDisplay.textContent = formatValue(defaultValue);
        labelEl.appendChild(valueDisplay);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultValue;
        slider.style.cssText = `
            width: 100%;
            cursor: pointer;
        `;

        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            valueDisplay.textContent = formatValue(value);

            const config = {};
            if (id === 'brand-font-size') {
                config.brandFontSize = value + 'rem';
            } else if (id === 'link-font-size') {
                config.linkFontSize = value + 'rem';
            }
            window.navbarCustomizer.save(config);
        });

        group.appendChild(labelEl);
        group.appendChild(slider);
        return group;
    }

    /**
     * 加载当前设置到UI
     */
    function loadCurrentSettings() {
        const config = JSON.parse(localStorage.getItem('navbarConfig') || '{}');

        if (config.brandFontSize) {
            const slider = document.getElementById('brand-font-size');
            if (slider) slider.value = parseFloat(config.brandFontSize);
        }

        if (config.linkFontSize) {
            const slider = document.getElementById('link-font-size');
            if (slider) slider.value = parseFloat(config.linkFontSize);
        }

        if (config.fontFamily) {
            const select = document.getElementById('navbar-font-family');
            if (select) select.value = config.fontFamily;
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createSettingsPanel();
            loadCurrentSettings();
        });
    } else {
        createSettingsPanel();
        loadCurrentSettings();
    }
})();
