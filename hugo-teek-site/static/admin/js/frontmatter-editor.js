/**
 * Front Matter 可视化编辑器
 * 支持 YAML 和 TOML 格式
 * 提供可视化表单和原始文本两种编辑模式
 */

class FrontMatterEditor {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;
    this.data = {};  // Front Matter 数据
    this.type = 'yaml';  // yaml | toml
    this.mode = 'visual';  // visual | raw
    this.customFields = {};  // 自定义字段

    if (!this.container) {
      console.error('容器元素未找到');
      return;
    }

    // 解析初始数据
    if (options.value) {
      this.parseInput(options.value);
    }

    // 渲染编辑器
    this.render();
    this.bindEvents();
  }

  /**
   * 解析输入数据
   * @param {object|string} input - Front Matter 对象或字符串
   */
  parseInput(input) {
    if (typeof input === 'object') {
      // 直接是对象
      this.type = input.type || 'yaml';
      this.data = input.data || {};
    } else if (typeof input === 'string') {
      // 字符串，尝试解析
      try {
        if (input.trim().startsWith('---')) {
          this.type = 'yaml';
          const yamlContent = input.replace(/^---\n/, '').replace(/\n---$/, '');
          this.data = jsyaml.load(yamlContent) || {};
        } else if (input.trim().startsWith('+++')) {
          this.type = 'toml';
          const tomlContent = input.replace(/^\+\+\+\n/, '').replace(/\n\+\+\+$/, '');
          this.data = TOML.parse(tomlContent) || {};
        } else {
          // 默认 YAML
          this.data = jsyaml.load(input) || {};
        }
      } catch (error) {
        console.error('Front Matter 解析失败:', error);
        this.data = {};
      }
    }

    // 提取自定义字段（非标准字段）
    this.extractCustomFields();
  }

  /**
   * 提取自定义字段
   */
  extractCustomFields() {
    const standardFields = ['title', 'date', 'draft', 'tags', 'categories', 'description', 'permalink', 'author', 'weight'];

    this.customFields = {};
    for (const [key, value] of Object.entries(this.data)) {
      if (!standardFields.includes(key)) {
        this.customFields[key] = value;
      }
    }
  }

  /**
   * 渲染编辑器
   */
  render() {
    this.container.innerHTML = `
      <div class="fm-editor">
        <div class="fm-header">
          <h4>文章元数据 (Front Matter)</h4>
          <div class="fm-header-actions">
            <select id="fm-type-select" class="fm-type-select" title="Front Matter 格式">
              <option value="yaml" ${this.type === 'yaml' ? 'selected' : ''}>YAML</option>
              <option value="toml" ${this.type === 'toml' ? 'selected' : ''}>TOML</option>
            </select>
            <button id="fm-toggle-mode" class="btn btn-sm" title="切换编辑模式">
              <i class="ph ${this.mode === 'visual' ? 'ph-code' : 'ph-text-aa'}"></i>
              ${this.mode === 'visual' ? '原始格式' : '可视化'}
            </button>
          </div>
        </div>

        <!-- 可视化模式 -->
        <div class="fm-visual" id="fm-visual-mode" style="${this.mode === 'raw' ? 'display: none;' : ''}">
          <div class="fm-grid">
            <!-- 标题 -->
            <div class="form-group">
              <label for="fm-title">标题 <span class="required">*</span></label>
              <input type="text" id="fm-title" class="form-control" value="${this.escapeHtml(this.data.title || '')}" required placeholder="文章标题">
            </div>

            <!-- 日期 -->
            <div class="form-group">
              <label for="fm-date">发布日期</label>
              <input type="datetime-local" id="fm-date" class="form-control" value="${this.formatDateForInput(this.data.date)}">
            </div>

            <!-- 草稿状态 -->
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="fm-draft" ${this.data.draft ? 'checked' : ''}>
                <span>设为草稿</span>
              </label>
              <small class="form-hint">草稿不会在网站上显示</small>
            </div>

            <!-- 描述 -->
            <div class="form-group full-width">
              <label for="fm-description">摘要/描述</label>
              <textarea id="fm-description" class="form-control" rows="2" placeholder="文章摘要（用于 SEO 和预览）">${this.escapeHtml(this.data.description || '')}</textarea>
            </div>

            <!-- 标签 -->
            <div class="form-group full-width">
              <label for="fm-tags">标签</label>
              <div class="tag-input" id="fm-tags-container">
                ${this.renderTags()}
                <input type="text" id="fm-tag-input" class="tag-input-field" placeholder="输入标签后按回车">
              </div>
              <small class="form-hint">按 Enter 添加标签</small>
            </div>

            <!-- 分类 -->
            <div class="form-group full-width">
              <label for="fm-categories">分类</label>
              <div class="tag-input" id="fm-categories-container">
                ${this.renderCategories()}
                <input type="text" id="fm-category-input" class="tag-input-field" placeholder="输入分类后按回车">
              </div>
              <small class="form-hint">按 Enter 添加分类</small>
            </div>

            <!-- 固定链接 -->
            <div class="form-group full-width">
              <label for="fm-permalink">固定链接 (Permalink)</label>
              <input type="text" id="fm-permalink" class="form-control" value="${this.escapeHtml(this.data.permalink || '')}" placeholder="留空则自动生成">
            </div>

            <!-- 权重 -->
            <div class="form-group">
              <label for="fm-weight">权重 (Weight)</label>
              <input type="number" id="fm-weight" class="form-control" value="${this.data.weight || ''}" placeholder="用于排序">
              <small class="form-hint">数值越小越靠前</small>
            </div>

            <!-- 作者 -->
            <div class="form-group">
              <label for="fm-author">作者</label>
              <input type="text" id="fm-author" class="form-control" value="${this.escapeHtml(this.data.author || '')}" placeholder="作者名称">
            </div>

            <!-- 自定义字段 -->
            ${this.renderCustomFields()}
          </div>

          <div class="fm-actions">
            <button id="fm-add-custom-field" class="btn btn-sm">
              <i class="ph ph-plus"></i> 添加自定义字段
            </button>
          </div>
        </div>

        <!-- 原始模式 -->
        <div class="fm-raw" id="fm-raw-mode" style="${this.mode === 'visual' ? 'display: none;' : ''}">
          <textarea id="fm-raw-content" class="form-control fm-raw-textarea" rows="15">${this.serialize()}</textarea>
        </div>
      </div>
    `;
  }

  /**
   * 渲染标签
   */
  renderTags() {
    const tags = this.data.tags || [];
    if (!Array.isArray(tags)) return '';

    return tags.map(tag => `
      <span class="tag" data-value="${this.escapeHtml(tag)}">
        ${this.escapeHtml(tag)}
        <button class="tag-remove" data-type="tag" data-value="${this.escapeHtml(tag)}">&times;</button>
      </span>
    `).join('');
  }

  /**
   * 渲染分类
   */
  renderCategories() {
    const categories = this.data.categories || [];
    if (!Array.isArray(categories)) return '';

    return categories.map(cat => `
      <span class="tag tag-category" data-value="${this.escapeHtml(cat)}">
        ${this.escapeHtml(cat)}
        <button class="tag-remove" data-type="category" data-value="${this.escapeHtml(cat)}">&times;</button>
      </span>
    `).join('');
  }

  /**
   * 渲染自定义字段
   */
  renderCustomFields() {
    if (Object.keys(this.customFields).length === 0) {
      return '';
    }

    return `
      <div class="form-group full-width">
        <label>自定义字段</label>
        <div class="custom-fields" id="fm-custom-fields">
          ${Object.entries(this.customFields).map(([key, value]) => `
            <div class="custom-field-row" data-key="${this.escapeHtml(key)}">
              <input type="text" class="form-control custom-field-key" value="${this.escapeHtml(key)}" placeholder="字段名">
              <input type="text" class="form-control custom-field-value" value="${this.escapeHtml(String(value))}" placeholder="值">
              <button class="btn btn-sm btn-danger custom-field-remove" data-key="${this.escapeHtml(key)}">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 切换编辑模式
    const toggleBtn = this.container.querySelector('#fm-toggle-mode');
    if (toggleBtn) {
      toggleBtn.onclick = () => this.toggleMode();
    }

    // 切换 Front Matter 类型
    const typeSelect = this.container.querySelector('#fm-type-select');
    if (typeSelect) {
      typeSelect.onchange = (e) => {
        this.type = e.target.value;
        this.syncFromVisual();  // 同步数据
        if (this.mode === 'raw') {
          this.updateRawContent();
        }
      };
    }

    // 标签输入
    const tagInput = this.container.querySelector('#fm-tag-input');
    if (tagInput) {
      tagInput.onkeydown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          this.addTag(e.target.value.trim());
          e.target.value = '';
        }
      };
    }

    // 分类输入
    const catInput = this.container.querySelector('#fm-category-input');
    if (catInput) {
      catInput.onkeydown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          this.addCategory(e.target.value.trim());
          e.target.value = '';
        }
      };
    }

    // 标签/分类删除
    this.container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.onclick = (e) => {
        const type = e.target.dataset.type;
        const value = e.target.dataset.value;
        if (type === 'tag') {
          this.removeTag(value);
        } else if (type === 'category') {
          this.removeCategory(value);
        }
      };
    });

    // 添加自定义字段
    const addCustomBtn = this.container.querySelector('#fm-add-custom-field');
    if (addCustomBtn) {
      addCustomBtn.onclick = () => this.addCustomField();
    }

    // 删除自定义字段
    this.container.querySelectorAll('.custom-field-remove').forEach(btn => {
      btn.onclick = (e) => {
        const key = e.target.closest('button').dataset.key;
        this.removeCustomField(key);
      };
    });

    // 原始模式输入
    const rawTextarea = this.container.querySelector('#fm-raw-content');
    if (rawTextarea) {
      rawTextarea.oninput = () => {
        // 实时解析（可能有性能问题，可以改为失焦时解析）
        this.syncFromRaw();
      };
    }

    // 其他字段输入（实时同步）
    const inputs = this.container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (!input.id || input.id.includes('tag-input') || input.id.includes('category-input')) {
        return;
      }

      input.oninput = () => {
        if (this.options.onChange) {
          this.syncFromVisual();
          this.options.onChange(this.getValue());
        }
      };
    });
  }

  /**
   * 切换编辑模式
   */
  toggleMode() {
    if (this.mode === 'visual') {
      // 切换到原始模式前，先同步数据
      this.syncFromVisual();
      this.mode = 'raw';
      this.updateRawContent();
    } else {
      // 切换到可视化模式前，先从原始模式同步
      this.syncFromRaw();
      this.mode = 'visual';
    }

    // 重新渲染
    this.render();
    this.bindEvents();
  }

  /**
   * 从可视化模式同步数据
   */
  syncFromVisual() {
    this.data = {
      title: this.container.querySelector('#fm-title')?.value || '',
      date: this.parseDateFromInput(this.container.querySelector('#fm-date')?.value),
      draft: this.container.querySelector('#fm-draft')?.checked || false,
      description: this.container.querySelector('#fm-description')?.value || '',
      tags: this.data.tags || [],
      categories: this.data.categories || [],
      permalink: this.container.querySelector('#fm-permalink')?.value || '',
      weight: parseInt(this.container.querySelector('#fm-weight')?.value) || undefined,
      author: this.container.querySelector('#fm-author')?.value || ''
    };

    // 添加自定义字段
    const customFieldRows = this.container.querySelectorAll('.custom-field-row');
    customFieldRows.forEach(row => {
      const keyInput = row.querySelector('.custom-field-key');
      const valueInput = row.querySelector('.custom-field-value');
      if (keyInput && valueInput && keyInput.value) {
        this.data[keyInput.value] = valueInput.value;
      }
    });

    // 清除空值
    Object.keys(this.data).forEach(key => {
      if (this.data[key] === '' || this.data[key] === undefined) {
        delete this.data[key];
      }
    });
  }

  /**
   * 从原始模式同步数据
   */
  syncFromRaw() {
    try {
      const rawContent = this.container.querySelector('#fm-raw-content')?.value || '';

      if (this.type === 'yaml') {
        this.data = jsyaml.load(rawContent) || {};
      } else if (this.type === 'toml') {
        this.data = TOML.parse(rawContent) || {};
      }

      this.extractCustomFields();
    } catch (error) {
      console.error('原始内容解析失败:', error);
      // 不覆盖原有数据
    }
  }

  /**
   * 更新原始模式内容
   */
  updateRawContent() {
    const textarea = this.container.querySelector('#fm-raw-content');
    if (textarea) {
      textarea.value = this.serialize();
    }
  }

  /**
   * 添加标签
   */
  addTag(tag) {
    if (!this.data.tags) {
      this.data.tags = [];
    }

    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
      this.render();
      this.bindEvents();
    }
  }

  /**
   * 删除标签
   */
  removeTag(tag) {
    if (this.data.tags) {
      this.data.tags = this.data.tags.filter(t => t !== tag);
      this.render();
      this.bindEvents();
    }
  }

  /**
   * 添加分类
   */
  addCategory(category) {
    if (!this.data.categories) {
      this.data.categories = [];
    }

    if (!this.data.categories.includes(category)) {
      this.data.categories.push(category);
      this.render();
      this.bindEvents();
    }
  }

  /**
   * 删除分类
   */
  removeCategory(category) {
    if (this.data.categories) {
      this.data.categories = this.data.categories.filter(c => c !== category);
      this.render();
      this.bindEvents();
    }
  }

  /**
   * 添加自定义字段
   */
  addCustomField() {
    const key = prompt('请输入字段名称:');
    if (key && key.trim()) {
      this.customFields[key.trim()] = '';
      this.data[key.trim()] = '';
      this.render();
      this.bindEvents();
    }
  }

  /**
   * 删除自定义字段
   */
  removeCustomField(key) {
    delete this.customFields[key];
    delete this.data[key];
    this.render();
    this.bindEvents();
  }

  /**
   * 序列化为 YAML/TOML 字符串
   */
  serialize() {
    try {
      if (this.type === 'yaml') {
        return jsyaml.dump(this.data, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
      } else if (this.type === 'toml') {
        return TOML.stringify(this.data);
      }
    } catch (error) {
      console.error('序列化失败:', error);
      return '';
    }
  }

  /**
   * 获取完整值（包括类型信息）
   */
  getValue() {
    // 确保从当前模式同步数据
    if (this.mode === 'visual') {
      this.syncFromVisual();
    } else {
      this.syncFromRaw();
    }

    return {
      type: this.type,
      data: this.data,
      raw: this.serialize()
    };
  }

  /**
   * 设置值
   */
  setValue(value) {
    this.parseInput(value);
    this.render();
    this.bindEvents();
  }

  /**
   * 格式化日期为 input[type=datetime-local] 格式
   */
  formatDateForInput(date) {
    if (!date) {
      return '';
    }

    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return '';
      }

      // 格式: YYYY-MM-DDTHH:mm
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * 解析 input[type=datetime-local] 的值为 Date 对象
   */
  parseDateFromInput(dateString) {
    if (!dateString) {
      return undefined;
    }

    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      return undefined;
    }
  }

  /**
   * HTML 转义
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 销毁编辑器
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// 导出（兼容 ES6 模块和全局变量）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontMatterEditor;
} else if (typeof window !== 'undefined') {
  window.FrontMatterEditor = FrontMatterEditor;
}
