/**
 * 通用数据表格组件使用示例
 * 
 * 这个示例展示如何使用 DataTable 组件快速创建增删改查页面
 */

// ============================================
// 示例 1: 简单的用户管理
// ============================================
const usersTableConfig = {
    apiEndpoint: '/users',
    title: '用户',
    dataKey: 'users',
    pageSize: 20,
    searchFields: ['name', 'email', 'phone'],
    
    columns: [
        { label: '用户名', field: 'name', width: '150px' },
        { label: '邮箱', field: 'email' },
        { label: '电话', field: 'phone', width: '140px' },
        { 
            label: '状态', 
            field: 'active',
            width: '100px',
            render: (value) => value ? '<span style="color: green;">✓ 启用</span>' : '<span style="color: red;">✗ 禁用</span>'
        }
    ],
    
    formFields: [
        { name: 'name', label: '用户名', type: 'text', required: true },
        { name: 'email', label: '邮箱', type: 'email', required: true },
        { name: 'phone', label: '电话', type: 'tel', required: false },
        { name: 'active', label: '启用', type: 'checkbox', defaultValue: true }
    ]
};

// ============================================
// 示例 2: 文章分类管理
// ============================================
const categoriesTableConfig = {
    apiEndpoint: '/categories',
    title: '分类',
    dataKey: 'categories',
    searchFields: ['name', 'slug'],
    
    columns: [
        { label: '分类名', field: 'name' },
        { label: 'Slug', field: 'slug' },
        { 
            label: '文章数', 
            field: 'count',
            width: '100px',
            render: (value) => `<span style="color: #3b82f6; font-weight: 600;">${value || 0}</span>`
        }
    ],
    
    formFields: [
        { name: 'name', label: '分类名', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'category-slug' },
        { name: 'description', label: '描述', type: 'textarea' }
    ],
    
    // 保存前处理
    onSave: (data, index) => {
        // 自动生成 slug
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
        }
        return data;
    }
};

// ============================================
// 示例 3: 带嵌套字段的配置
// ============================================
const settingsTableConfig = {
    apiEndpoint: '/settings',
    title: '配置项',
    dataKey: 'items',
    
    columns: [
        { label: '键名', field: 'key' },
        { label: '值', field: 'value' },
        { label: '分组', field: 'group.name', width: '120px' }  // 嵌套字段
    ],
    
    formFields: [
        { name: 'key', label: '键名', type: 'text', required: true },
        { name: 'value', label: '值', type: 'text', required: true },
        { 
            name: 'group.name', 
            label: '分组', 
            type: 'select',
            options: [
                { value: 'basic', label: '基础配置' },
                { value: 'advanced', label: '高级配置' },
                { value: 'system', label: '系统配置' }
            ]
        }
    ]
};

// ============================================
// 示例 4: 带自定义操作的表格
// ============================================
const productsTableConfig = {
    apiEndpoint: '/products',
    title: '产品',
    dataKey: 'products',
    
    columns: [
        { 
            label: '产品', 
            field: 'name',
            render: (value, item) => `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <strong>${value}</strong>
                </div>
            `
        },
        { label: '价格', field: 'price', width: '100px', render: (value) => `¥${value}` },
        { label: '库存', field: 'stock', width: '80px' }
    ],
    
    formFields: [
        { name: 'name', label: '产品名', type: 'text', required: true },
        { name: 'price', label: '价格', type: 'number', required: true },
        { name: 'stock', label: '库存', type: 'number', defaultValue: 0 },
        { name: 'image', label: '图片URL', type: 'url' },
        { name: 'description', label: '描述', type: 'textarea' }
    ],
    
    customActions: [
        {
            label: '导出Excel',
            icon: '📊',
            style: 'background: #10b981;',
            onClick: 'exportProducts()'
        },
        {
            label: '导入',
            icon: '📥',
            style: 'background: #8b5cf6;',
            onClick: 'importProducts()'
        }
    ]
};

// ============================================
// 使用方法
// ============================================

// 在页面中使用：
let dataTable;

async function loadUsers() {
    dataTable = new DataTable(usersTableConfig);
    await dataTable.load();
}

async function loadCategories() {
    dataTable = new DataTable(categoriesTableConfig);
    await dataTable.load();
}

// 自定义导出功能示例
function exportProducts() {
    const data = dataTable.getDataArray();
    const csv = convertToCSV(data);
    downloadFile(csv, 'products.csv');
}

function convertToCSV(data) {
    // 实现CSV转换逻辑
    return data.map(row => Object.values(row).join(',')).join('\n');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}
/**
 * 通用数据表格组件使用示例
 * 
 * 这个示例展示如何使用 DataTable 组件快速创建增删改查页面
 */

// ============================================
// 示例 1: 简单的用户管理
// ============================================
const usersTableConfig = {
    apiEndpoint: '/users',
    title: '用户',
    dataKey: 'users',
    pageSize: 20,
    searchFields: ['name', 'email', 'phone'],
    
    columns: [
        { label: '用户名', field: 'name', width: '150px' },
        { label: '邮箱', field: 'email' },
        { label: '电话', field: 'phone', width: '140px' },
        { 
            label: '状态', 
            field: 'active',
            width: '100px',
            render: (value) => value ? '<span style="color: green;">✓ 启用</span>' : '<span style="color: red;">✗ 禁用</span>'
        }
    ],
    
    formFields: [
        { name: 'name', label: '用户名', type: 'text', required: true },
        { name: 'email', label: '邮箱', type: 'email', required: true },
        { name: 'phone', label: '电话', type: 'tel', required: false },
        { name: 'active', label: '启用', type: 'checkbox', defaultValue: true }
    ]
};

// ============================================
// 示例 2: 文章分类管理
// ============================================
const categoriesTableConfig = {
    apiEndpoint: '/categories',
    title: '分类',
    dataKey: 'categories',
    searchFields: ['name', 'slug'],
    
    columns: [
        { label: '分类名', field: 'name' },
        { label: 'Slug', field: 'slug' },
        { 
            label: '文章数', 
            field: 'count',
            width: '100px',
            render: (value) => `<span style="color: #3b82f6; font-weight: 600;">${value || 0}</span>`
        }
    ],
    
    formFields: [
        { name: 'name', label: '分类名', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'category-slug' },
        { name: 'description', label: '描述', type: 'textarea' }
    ],
    
    // 保存前处理
    onSave: (data, index) => {
        // 自动生成 slug
        if (!data.slug) {
            data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
        }
        return data;
    }
};

// ============================================
// 示例 3: 带嵌套字段的配置
// ============================================
const settingsTableConfig = {
    apiEndpoint: '/settings',
    title: '配置项',
    dataKey: 'items',
    
    columns: [
        { label: '键名', field: 'key' },
        { label: '值', field: 'value' },
        { label: '分组', field: 'group.name', width: '120px' }  // 嵌套字段
    ],
    
    formFields: [
        { name: 'key', label: '键名', type: 'text', required: true },
        { name: 'value', label: '值', type: 'text', required: true },
        { 
            name: 'group.name', 
            label: '分组', 
            type: 'select',
            options: [
                { value: 'basic', label: '基础配置' },
                { value: 'advanced', label: '高级配置' },
                { value: 'system', label: '系统配置' }
            ]
        }
    ]
};

// ============================================
// 示例 4: 带自定义操作的表格
// ============================================
const productsTableConfig = {
    apiEndpoint: '/products',
    title: '产品',
    dataKey: 'products',
    
    columns: [
        { 
            label: '产品', 
            field: 'name',
            render: (value, item) => `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <strong>${value}</strong>
                </div>
            `
        },
        { label: '价格', field: 'price', width: '100px', render: (value) => `¥${value}` },
        { label: '库存', field: 'stock', width: '80px' }
    ],
    
    formFields: [
        { name: 'name', label: '产品名', type: 'text', required: true },
        { name: 'price', label: '价格', type: 'number', required: true },
        { name: 'stock', label: '库存', type: 'number', defaultValue: 0 },
        { name: 'image', label: '图片URL', type: 'url' },
        { name: 'description', label: '描述', type: 'textarea' }
    ],
    
    customActions: [
        {
            label: '导出Excel',
            icon: '📊',
            style: 'background: #10b981;',
            onClick: 'exportProducts()'
        },
        {
            label: '导入',
            icon: '📥',
            style: 'background: #8b5cf6;',
            onClick: 'importProducts()'
        }
    ]
};

// ============================================
// 使用方法
// ============================================

// 在页面中使用：
let dataTable;

async function loadUsers() {
    dataTable = new DataTable(usersTableConfig);
    await dataTable.load();
}

async function loadCategories() {
    dataTable = new DataTable(categoriesTableConfig);
    await dataTable.load();
}

// 自定义导出功能示例
function exportProducts() {
    const data = dataTable.getDataArray();
    const csv = convertToCSV(data);
    downloadFile(csv, 'products.csv');
}

function convertToCSV(data) {
    // 实现CSV转换逻辑
    return data.map(row => Object.values(row).join(',')).join('\n');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}
