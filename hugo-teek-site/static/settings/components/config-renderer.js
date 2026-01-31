/**
 * 配置渲染器
 * 负责根据配置映射动态生成表单UI，并处理数据读写
 */

class ConfigRenderer {
    constructor(config) {
        this.config = config;
    }

    /**
     * 根据路径获取配置值
     * @param {string} path - 配置路径，如 'params.blogger.name'
     * @returns {*} 配置值
     */
    getValue(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * 根据路径设置配置值
     * @param {string} path - 配置路径
     * @param {*} value - 要设置的值
     */
    setValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        target[lastKey] = value;
    }

    /**
     * 渲染单个表单字段
     * @param {object} fieldDef - 字段定义
     * @returns {string} HTML字符串
     */
    renderField(fieldDef) {
        const value = this.getValue(fieldDef.path);
        const id = fieldDef.path.replace(/\./g, '-');
        const placeholder = fieldDef.placeholder || '';

        switch (fieldDef.type) {
            case 'boolean':
                return `
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" id="${id}" ${value ? 'checked' : ''}>
                            ${fieldDef.label}
                        </label>
                    </div>
                `;

            case 'select':
                return `
                    <div class="form-group">
                        <label class="form-label">${fieldDef.label}</label>
                        <select class="form-input" id="${id}">
                            ${fieldDef.options.map(opt =>
                    `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                ).join('')}
                        </select>
                    </div>
                `;

            case 'array':
                return `
                    <div class="form-group">
                        <label class="form-label">${fieldDef.label}</label>
                        <input type="text" class="form-input" id="${id}"
                            value="${Array.isArray(value) ? value.join(', ') : ''}"
                            placeholder="${placeholder}">
                    </div>
                `;

            case 'textarea':
                return `
                    <div class="form-group">
                        <label class="form-label">${fieldDef.label}</label>
                        <textarea class="form-input" id="${id}"
                            placeholder="${placeholder}" rows="3">${value || ''}</textarea>
                    </div>
                `;

            default: // text, url, email, number
                return `
                    <div class="form-group">
                        <label class="form-label">${fieldDef.label}</label>
                        <input type="${fieldDef.type || 'text'}" class="form-input" id="${id}"
                            value="${value || ''}" placeholder="${placeholder}">
                    </div>
                `;
        }
    }

    /**
     * 渲染一组字段（以标题分组）
     * @param {string} title - 分组标题
     * @param {Array} fields - 字段数组
     * @returns {string} HTML字符串
     */
    renderGroup(title, fields) {
        return `
            <h3 style="margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                ${title}
            </h3>
            ${fields.map(f => this.renderField(f)).join('')}
        `;
    }

    /**
     * 渲染卡片（用于插件页面）
     * @param {string} title - 卡片标题
     * @param {string} icon - 图标
     * @param {Array} fields - 字段数组
     * @returns {string} HTML字符串
     */
    renderCard(title, icon, fields) {
        return `
            <div class="item-card">
                <h4 style="margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${icon}</span>
                    <span>${title}</span>
                </h4>
                ${fields.map(f => this.renderField(f)).join('')}
            </div>
        `;
    }

    /**
     * 渲染多列表单行
     * @param {Array} fields - 字段数组
     * @returns {string} HTML字符串
     */
    renderRow(fields) {
        return `
            <div class="form-row">
                ${fields.map(f => this.renderField(f)).join('')}
            </div>
        `;
    }

    /**
     * 从表单收集数据并更新配置对象
     * @param {object} mapping - 配置映射对象
     */
    collectFormData(mapping) {
        // 展平所有字段
        const flattenFields = (obj) => {
            let fields = [];
            for (let key in obj) {
                if (Array.isArray(obj[key]) && obj[key][0]?.path) {
                    fields = fields.concat(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    fields = fields.concat(flattenFields(obj[key]));
                }
            }
            return fields;
        };

        const fields = flattenFields(mapping);

        fields.forEach(field => {
            const id = field.path.replace(/\./g, '-');
            const element = document.getElementById(id);

            if (!element) return;

            let value;
            if (field.type === 'boolean') {
                value = element.checked;
            } else if (field.type === 'number') {
                value = parseFloat(element.value);
                if (isNaN(value)) value = 0;
            } else if (field.type === 'array') {
                value = element.value.split(',').map(s => s.trim()).filter(s => s);
            } else {
                value = element.value;
            }

            this.setValue(field.path, value);
        });
    }

    /**
     * 确保配置对象有所需的默认值
     * @param {object} defaults - 默认值映射
     */
    ensureDefaults(defaults) {
        const setDefault = (path, defaultValue) => {
            const current = this.getValue(path);
            if (current === undefined || current === null) {
                this.setValue(path, defaultValue);
            }
        };

        // 遍历默认值映射
        const processDefaults = (obj, prefix = '') => {
            for (let key in obj) {
                const path = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    processDefaults(obj[key], path);
                } else {
                    setDefault(path, obj[key]);
                }
            }
        };

        if (defaults) {
            processDefaults(defaults);
        }
    }
}

/**
 * 通用配置保存函数
 * @param {object} mapping - 配置映射
 * @param {string} successMessage - 成功消息
 */
async function saveConfigSection(mapping, successMessage = '配置已保存！') {
    try {
        if (!window.currentConfig) {
            throw new Error('配置对象未加载');
        }

        const renderer = new ConfigRenderer(window.currentConfig);
        renderer.collectFormData(mapping);

        const response = await fetch(`${API_BASE}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.currentConfig)
        });

        if (response.ok) {
            showToast(successMessage, 'success');
        } else {
            throw new Error('保存失败');
        }
    } catch (error) {
        showToast(`保存失败: ${error.message}`, 'error');
        console.error('Save config error:', error);
    }
}
