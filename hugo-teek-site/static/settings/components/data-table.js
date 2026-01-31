/**
 * 通用数据表格管理组件
 * 支持: CRUD、搜索、分页、批量操作、弹窗编辑
 */
class DataTable {
    constructor(config) {
        this.config = {
            apiEndpoint: config.apiEndpoint,           // API 端点
            title: config.title || '数据管理',          // 标题
            columns: config.columns || [],              // 列配置
            formFields: config.formFields || [],        // 表单字段配置
            dataKey: config.dataKey || 'items',         // 数据键名
            pageSize: config.pageSize || 10,            // 每页条数
            searchFields: config.searchFields || [],    // 搜索字段
            onSave: config.onSave,                      // 保存前钩子
            onLoad: config.onLoad,                      // 加载后钩子
            customActions: config.customActions || []   // 自定义操作按钮
        };
        
        this.data = null;
        this.selectedItems = new Set();
        this.currentPage = 1;
        this.searchKeyword = '';
    }
    
    // 加载数据
    async load() {
        const content = document.getElementById('cms-content');
        content.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            const response = await fetch(`${API_BASE}${this.config.apiEndpoint}`);
            this.data = await response.json();
            
            if (this.config.onLoad) {
                this.data = this.config.onLoad(this.data);
            }
            
            this.render();
        } catch (error) {
            content.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        }
    }
    
    // 获取数据数组
    getDataArray() {
        return this.config.dataKey ? this.data[this.config.dataKey] : this.data;
    }
    
    // 设置数据数组
    setDataArray(array) {
        if (this.config.dataKey) {
            this.data[this.config.dataKey] = array;
        } else {
            this.data = array;
        }
    }
    
    // 过滤数据
    getFilteredData() {
        const dataArray = this.getDataArray();
        if (!this.searchKeyword) return dataArray;
        
        const keyword = this.searchKeyword.toLowerCase();
        return dataArray.filter(item => {
            return this.config.searchFields.some(field => {
                const value = this.getNestedValue(item, field);
                return value && value.toString().toLowerCase().includes(keyword);
            });
        });
    }
    
    // 获取嵌套属性值
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    // 渲染表格
    render() {
        const content = document.getElementById('cms-content');
        const filteredData = this.getFilteredData();
        const totalPages = Math.ceil(filteredData.length / this.config.pageSize);
        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        const endIndex = startIndex + this.config.pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        const html = `
            <div id="table-message"></div>
            
            <div class="table-container">
                <div class="table-toolbar">
                    <div class="toolbar-left">
                        <button class="btn btn-primary" onclick="dataTable.openModal()">➕ 新增${this.config.title}</button>
                        <button class="btn btn-danger" 
                            onclick="dataTable.batchDelete()" 
                            ${this.selectedItems.size === 0 ? 'disabled' : ''}>
                            🗑️ 批量删除 ${this.selectedItems.size > 0 ? `(${this.selectedItems.size})` : ''}
                        </button>
                        ${this.config.customActions.map(action => `
                            <button class="btn" style="${action.style || ''}" onclick="${action.onClick}">
                                ${action.icon || ''} ${action.label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="toolbar-right">
                        <div class="search-box">
                            <input type="text" id="search-input" placeholder="搜索..." 
                                value="${this.searchKeyword}">
                        </div>
                    </div>
                </div>
                
                <div class="table-wrapper" id="table-body-container">
                    ${this.renderTableContent(pageData, startIndex)}
                </div>
                
                <div id="pagination-container">
                    ${totalPages > 1 ? this.renderPagination(filteredData.length, totalPages, startIndex, endIndex) : ''}
                </div>
            </div>
            
            ${this.renderModal()}
        `;
        
        content.innerHTML = html;
        
        // 绑定搜索事件（使用防抖）
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 300);
            });
        }
    }
    
    // 渲染表格内容（可单独更新）
    renderTableContent(pageData, startIndex) {
        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">
                            <input type="checkbox" class="checkbox" 
                                onchange="dataTable.toggleSelectAll(this)" 
                                ${this.selectedItems.size === pageData.length && pageData.length > 0 ? 'checked' : ''}>
                        </th>
                        ${this.config.columns.map(col => `
                            <th ${col.width ? `style="width: ${col.width};"` : ''}>${col.label}</th>
                        `).join('')}
                        <th style="width: 120px; text-align: center;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageData.length === 0 ? `
                        <tr>
                            <td colspan="${this.config.columns.length + 2}" style="text-align: center; padding: 40px; color: #9ca3af;">
                                ${this.searchKeyword ? '未找到匹配的记录' : '暂无数据，点击"新增"添加'}
                            </td>
                        </tr>
                    ` : pageData.map((item, index) => {
                        const globalIndex = startIndex + index;
                        return `
                            <tr class="${this.selectedItems.has(globalIndex) ? 'selected' : ''}">
                                <td>
                                    <input type="checkbox" class="checkbox" 
                                        onchange="dataTable.toggleSelect(${globalIndex}, this.checked)" 
                                        ${this.selectedItems.has(globalIndex) ? 'checked' : ''}>
                                </td>
                                ${this.config.columns.map(col => `
                                    <td>${this.renderCell(item, col)}</td>
                                `).join('')}
                                <td style="text-align: center; white-space: nowrap;">
                                    <button class="action-btn" onclick="dataTable.edit(${globalIndex})" title="编辑">✏️</button>
                                    <button class="action-btn" onclick="dataTable.delete(${globalIndex})" title="删除">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    // 渲染单元格
    renderCell(item, column) {
        const value = this.getNestedValue(item, column.field);
        
        if (column.render) {
            return column.render(value, item);
        }
        
        if (value === null || value === undefined || value === '') {
            return '<span style="color: #9ca3af;">-</span>';
        }
        
        return value;
    }
    
    // 渲染分页
    renderPagination(total, totalPages, startIndex, endIndex) {
        return `
            <div class="pagination">
                <div class="pagination-info">
                    显示 ${startIndex + 1}-${Math.min(endIndex, total)} 条，共 ${total} 条
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" onclick="dataTable.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>
                    <button class="pagination-btn" onclick="dataTable.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
                    ${this.renderPaginationButtons(totalPages)}
                    <button class="pagination-btn" onclick="dataTable.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>
                    <button class="pagination-btn" onclick="dataTable.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>»</button>
                </div>
            </div>
        `;
    }
    
    renderPaginationButtons(totalPages) {
        let buttons = '';
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            buttons += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="dataTable.goToPage(${i})">${i}</button>`;
        }
        return buttons;
    }
    
    // 渲染弹窗
    renderModal() {
        return `
            <div class="modal" id="data-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">新增${this.config.title}</h3>
                        <button class="modal-close" onclick="dataTable.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="edit-index" value="-1">
                        ${this.config.formFields.map(field => this.renderFormField(field)).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="btn" onclick="dataTable.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="dataTable.save()">保存</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 渲染表单字段
    renderFormField(field) {
        const required = field.required ? '<span style="color: #ef4444;">*</span>' : '';
        const inputId = `field-${field.name}`;
        
        let inputHtml = '';
        switch (field.type) {
            case 'textarea':
                inputHtml = `<textarea class="form-input" id="${inputId}" placeholder="${field.placeholder || ''}" style="min-height: 100px;"></textarea>`;
                break;
            case 'select':
                inputHtml = `
                    <select class="form-input" id="${inputId}">
                        ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                `;
                break;
            case 'checkbox':
                inputHtml = `<input type="checkbox" class="checkbox" id="${inputId}">`;
                break;
            default:
                inputHtml = `<input type="${field.type || 'text'}" class="form-input" id="${inputId}" placeholder="${field.placeholder || ''}">`;
        }
        
        return `
            <div class="form-group">
                <label class="form-label">${field.label} ${required}</label>
                ${inputHtml}
            </div>
        `;
    }
    
    // 打开弹窗
    openModal(index = -1) {
        const modal = document.getElementById('data-modal');
        const title = document.getElementById('modal-title');
        
        if (index >= 0) {
            const item = this.getDataArray()[index];
            title.textContent = `编辑${this.config.title}`;
            document.getElementById('edit-index').value = index;
            
            this.config.formFields.forEach(field => {
                const inputId = `field-${field.name}`;
                const value = this.getNestedValue(item, field.name);
                const input = document.getElementById(inputId);
                
                if (field.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value || '';
                }
            });
        } else {
            title.textContent = `新增${this.config.title}`;
            document.getElementById('edit-index').value = -1;
            
            this.config.formFields.forEach(field => {
                const inputId = `field-${field.name}`;
                const input = document.getElementById(inputId);
                
                if (field.type === 'checkbox') {
                    input.checked = field.defaultValue || false;
                } else {
                    input.value = field.defaultValue || '';
                }
            });
        }
        
        modal.classList.add('active');
    }
    
    // 关闭弹窗
    closeModal() {
        document.getElementById('data-modal').classList.remove('active');
    }
    
    // 保存
    async save() {
        const editIndex = parseInt(document.getElementById('edit-index').value);
        const itemData = {};
        
        // 收集表单数据
        for (const field of this.config.formFields) {
            const inputId = `field-${field.name}`;
            const input = document.getElementById(inputId);
            
            if (field.required && !input.value && field.type !== 'checkbox') {
                window.showToast(`请输入${field.label}`, 'warning', 2000);
                return;
            }
            
            if (field.type === 'checkbox') {
                this.setNestedValue(itemData, field.name, input.checked);
            } else {
                this.setNestedValue(itemData, field.name, input.value.trim());
            }
        }
        
        // 调用保存前钩子
        if (this.config.onSave) {
            const result = this.config.onSave(itemData, editIndex);
            if (result === false) return;
            if (result) Object.assign(itemData, result);
        }
        
        const dataArray = this.getDataArray();
        if (editIndex >= 0) {
            dataArray[editIndex] = itemData;
        } else {
            dataArray.push(itemData);
        }
        
        await this.saveToServer();
        this.closeModal();
        this.updateTable();
    }
    
    // 设置嵌套属性值
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    
    // 编辑
    edit(index) {
        this.openModal(index);
    }
    
    // 删除
    async delete(index) {
        const result = await window.customConfirm('删除后无法恢复，确定要删除这条记录吗？', '删除确认', '🗑️');
        if (!result) return;
        
        const dataArray = this.getDataArray();
        dataArray.splice(index, 1);
        this.selectedItems.delete(index);
        
        await this.saveToServer();
        this.updateTable();
    }
    
    // 批量删除
    async batchDelete() {
        if (this.selectedItems.size === 0) return;
        
        const result = await window.customConfirm(
            `将删除 ${this.selectedItems.size} 条记录，此操作不可恢复！`,
            '批量删除确认',
            '🗑️'
        );
        if (!result) return;
        
        const dataArray = this.getDataArray();
        const indicesToDelete = Array.from(this.selectedItems).sort((a, b) => b - a);
        indicesToDelete.forEach(index => {
            dataArray.splice(index, 1);
        });
        
        this.selectedItems.clear();
        await this.saveToServer();
        this.updateTable();
    }
    
    // 搜索
    search(keyword) {
        this.searchKeyword = keyword;
        this.currentPage = 1;
        this.selectedItems.clear();
        this.updateTable();
    }
    
    // 更新表格（不重新渲染整个页面）
    updateTable() {
        const filteredData = this.getFilteredData();
        const totalPages = Math.ceil(filteredData.length / this.config.pageSize);
        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        const endIndex = startIndex + this.config.pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // 更新表格内容
        const tableContainer = document.getElementById('table-body-container');
        if (tableContainer) {
            tableContainer.innerHTML = this.renderTableContent(pageData, startIndex);
        }
        
        // 更新分页
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = totalPages > 1 ? this.renderPagination(filteredData.length, totalPages, startIndex, endIndex) : '';
        }
        
        // 更新批量删除按钮状态
        const batchDeleteBtn = document.querySelector('.toolbar-left .btn-danger');
        if (batchDeleteBtn) {
            batchDeleteBtn.disabled = this.selectedItems.size === 0;
            batchDeleteBtn.innerHTML = `🗑️ 批量删除 ${this.selectedItems.size > 0 ? `(${this.selectedItems.size})` : ''}`;
        }
    }
    
    // 翻页
    goToPage(page) {
        this.currentPage = page;
        this.updateTable();
    }
    
    // 全选/取消全选
    toggleSelectAll(checkbox) {
        const filteredData = this.getFilteredData();
        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        const endIndex = startIndex + this.config.pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (checkbox.checked) {
            pageData.forEach((_, index) => {
                this.selectedItems.add(startIndex + index);
            });
        } else {
            pageData.forEach((_, index) => {
                this.selectedItems.delete(startIndex + index);
            });
        }
        this.updateTable();
    }
    
    // 选择/取消选择
    toggleSelect(index, checked) {
        if (checked) {
            this.selectedItems.add(index);
        } else {
            this.selectedItems.delete(index);
        }
        this.updateTable();
    }
    
    // 保存到服务器
    async saveToServer() {
        try {
            const response = await fetch(`${API_BASE}${this.config.apiEndpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });
            
            if (response.ok) {
                window.showToast('保存成功！', 'success', 2000);
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            window.showToast(`保存失败: ${error.message}`, 'error', 3000);
        }
    }
}
