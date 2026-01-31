// 配置中心前端逻辑
// 默认配置 (会被 teektools.toml 中的配置覆盖)
let CONFIG = {
    // 自动适配当前访问的主机名，解决内网 IP 访问问题
    apiBase: `http://${window.location.hostname}:8888/api/v1`,
    fetchTimeout: 5000
};

// 获取 API 基础地址
function getApiBase() {
    return CONFIG.apiBase;
}

// 页面路由配置
const routes = {
    dashboard: renderDashboard,
    posts: renderPosts,
    media: () => renderPlaceholder('图片库'),
    comments: () => renderPlaceholder('评论管理'),
    theme: () => renderPlaceholder('主题定制'),
    menu: () => renderPlaceholder('菜单管理'),
    settings: renderSettings,
    backup: () => renderPlaceholder('备份还原'),
    build: () => renderPlaceholder('构建发布')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await loadFrontendConfig();
    initRouter();
    initSidebar();
    checkBackendHealth();
});

// 加载前端配置
async function loadFrontendConfig() {
    try {
        // 尝试从 Hugo 渲染的 config.json 获取配置 (如果已集成到 data 目录)
        // 或者尝试直接访问后端获取配置
        const response = await fetch(`${CONFIG.apiBase}/config`);
        if (response.ok) {
            const data = await response.json();
            if (data.params && data.params.teekTools && data.params.teekTools.frontend) {
                const feConfig = data.params.teekTools.frontend;
                if (feConfig.apiBase) CONFIG.apiBase = feConfig.apiBase;
                if (feConfig.fetchTimeout) CONFIG.fetchTimeout = feConfig.fetchTimeout;
                console.log('✅ 前端配置已加载:', CONFIG);
            }
        }
    } catch (e) {
        console.warn('⚠️ 加载前端配置失败，使用默认配置:', e);
    }
}

// 路由初始化
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // 处理初始路由
}

async function handleRoute() {
    let hash = window.location.hash.slice(1) || 'dashboard';
    
    // 处理带参数的路由 (例如 posts/edit?path=...)
    let query = {};
    if (hash.includes('?')) {
        const parts = hash.split('?');
        hash = parts[0];
        const searchParams = new URLSearchParams(parts[1]);
        for (const [key, value] of searchParams) {
            query[key] = value;
        }
    }

    // 处理子路由 (例如 posts/edit)
    let routeHandler = routes[hash];
    if (!routeHandler) {
        // 尝试匹配父级路由，如果需要的话 (这里主要针对 edit)
        if (hash === 'posts/edit') {
            routeHandler = () => renderPostEditor(query.path);
        }
    }

    const pageTitle = document.querySelector('.nav-item[href="#' + hash.split('/')[0] + '"] span')?.textContent || '配置中心';
    
    // 更新面包屑和标题
    document.getElementById('page-title').textContent = pageTitle;
    
    // 更新侧边栏激活状态
    const baseHash = hash.split('/')[0];
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[href="#${baseHash}"]`)?.classList.add('active');

    // 渲染内容
    const contentContainer = document.getElementById('page-content');

    // 直接渲染，无加载遮罩
    try {
        if (routeHandler) {
            const html = await routeHandler();
            contentContainer.innerHTML = html;
        } else {
            contentContainer.innerHTML = render404();
        }
    } catch (error) {
        console.error('Render failed:', error);
        contentContainer.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 48px;">
                <i class="ph ph-warning-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 16px;"></i>
                <h3>加载失败</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">无法连接到后端服务或发生未知错误</p>
                <p style="font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; display: inline-block; margin-bottom: 24px;">${error.message}</p>
                <div>
                    <button class="btn btn-primary" onclick="window.location.reload()">🔄 重试</button>
                </div>
            </div>
        `;
    }
}

// 侧边栏交互
function initSidebar() {
    // 可以在这里添加侧边栏折叠等逻辑
}

// 工具函数：带超时的 fetch
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = CONFIG.fetchTimeout } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// 检查后端健康状态
async function checkBackendHealth() {
    try {
        const response = await fetchWithTimeout(`${getApiBase()}/../ping`, { timeout: 3000 }); // 相对路径调整
        if (response.ok) {
            showToast('后端服务连接正常', 'success');
        } else {
            showToast('后端服务异常', 'error');
        }
    } catch (e) {
        showToast(`无法连接到后端服务 (${getApiBase()})`, 'error');
        console.error('Backend connection failed:', e);
    }
}

// 渲染仪表盘
async function renderDashboard() {
    let stats = {
        totalFiles: 0,
        totalWords: 0,
        totalCategories: 0,
        totalTags: 0
    };

    try {
        const response = await fetchWithTimeout(`${getApiBase()}/dashboard`);
        if (response.ok) {
            const data = await response.json();
            stats.totalFiles = data.fileList ? data.fileList.length : 0;
            stats.totalWords = data.totalFileWords || 0;
            stats.totalCategories = data.totalCategories || 0;
            stats.totalTags = data.totalTags || 0;
        } else {
            console.error('Failed to fetch dashboard data');
            showToast('获取仪表盘数据失败', 'error');
            // 抛出错误以便被 handleRoute 捕获并显示错误页面
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
    } catch (e) {
        console.error('Error fetching dashboard data:', e);
        showToast('无法连接到后端服务', 'error');
        throw e; // 重新抛出错误
    }

    return `
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="ph ph-article"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalFiles}</h3>
                    <p>总文章数</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ph ph-tag"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalTags}</h3>
                    <p>标签数量</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ph ph-folder"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalCategories}</h3>
                    <p>分类数量</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="ph ph-text-t"></i></div>
                <div class="stat-info">
                    <h3>${(stats.totalWords / 1000).toFixed(1)}k</h3>
                    <p>总字数</p>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">系统状态</h3>
            </div>
            <div style="padding: 20px; background: #f9fafb; border-radius: 6px;">
                <p>Hugo 版本: v0.120.0</p>
                <p>主题版本: v1.0.0</p>
                <p>上次构建: 2023-11-26 14:30:00</p>
            </div>
        </div>
    `;
}

// 渲染配置页面
async function renderSettings() {
    let configContent = '';
    let configPath = '';

    try {
        const response = await fetchWithTimeout(`${getApiBase()}/config`);
        if (response.ok) {
            const data = await response.json();
            configContent = data.content;
            configPath = data.path;
        } else {
            showToast('获取配置失败', 'error');
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (e) {
        console.error('Error fetching config:', e);
        showToast('无法连接到后端服务', 'error');
        throw e;
    }

    // 绑定保存事件 (利用事件委托，或者在渲染后绑定)
    setTimeout(() => {
        const saveBtn = document.getElementById('save-config-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const newContent = document.getElementById('config-editor').value;
                try {
                    const response = await fetchWithTimeout(`${getApiBase()}/config`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: newContent })
                    });
                    
                    if (response.ok) {
                        const res = await response.json();
                        showToast('配置保存成功', 'success');
                        if (res.backup) {
                            console.log('Backup created at:', res.backup);
                        }
                    } else {
                        const err = await response.json();
                        showToast(`保存失败: ${err.error}`, 'error');
                    }
                } catch (e) {
                    showToast('保存配置时发生错误', 'error');
                    console.error(e);
                }
            });
        }
    }, 100);

    return `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 class="card-title">通用设置</h3>
                    <p style="color: #6b7280; font-size: 0.9rem; margin-top: 4px;">当前配置文件: ${configPath}</p>
                </div>
                <button id="save-config-btn" class="btn btn-primary">
                    <i class="ph ph-floppy-disk"></i> 保存更改
                </button>
            </div>
            <div style="padding: 20px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">配置文件内容 (TOML)</label>
                    <textarea id="config-editor" 
                        style="width: 100%; height: 500px; padding: 12px; font-family: monospace; border: 1px solid #e5e7eb; border-radius: 6px; resize: vertical; background: #f9fafb;"
                        spellcheck="false">${configContent}</textarea>
                </div>
            </div>
        </div>
    `;
}

// 渲染文章列表
async function renderPosts() {
    let posts = [];
    let config = null;

    try {
        // 并行获取文章列表和配置
        const [postsResponse, configResponse] = await Promise.all([
            fetchWithTimeout(`${getApiBase()}/posts`),
            fetchWithTimeout(`${getApiBase()}/config`)
        ]);

        if (postsResponse.ok) {
            const res = await postsResponse.json();
            posts = res.data || [];
        } else {
            showToast('获取文章列表失败', 'error');
            throw new Error(`API Error: ${postsResponse.status}`);
        }

        if (configResponse.ok) {
            const res = await configResponse.json();
            const configData = res.data ? res.data.params : (res.params || {});
            // 解析配置中的 additionalDocs
            if (configData && configData.teekTools && configData.teekTools.paths && configData.teekTools.paths.contentDocsAdditional) {
                // 适配新版配置结构
                config = {
                    params: {
                        content: {
                            additionalDocs: configData.teekTools.paths.contentDocsAdditional
                        }
                    }
                };
            } else if (configData && configData.content && configData.content.additionalDocs) {
                // 适配旧版配置结构
                config = { params: configData };
            }
        }
    } catch (e) {
        console.error('Error fetching data:', e);
        showToast('无法连接到后端服务', 'error');
        throw e;
    }

    // 确保 posts 是数组
    if (!Array.isArray(posts)) {
        console.warn('Posts data is not an array:', posts);
        posts = [];
    }

    // 构建目录树结构 (传入配置以支持多根目录)
    const tree = buildDirectoryTree(posts, config);
    
    // 绑定事件
    setTimeout(() => {
        // 树节点点击事件
        document.querySelectorAll('.tree-node-content').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                // 切换展开状态
                const parent = node.parentElement;
                parent.classList.toggle('expanded');
                
                // 更新选中状态
                document.querySelectorAll('.tree-node-content').forEach(n => n.classList.remove('active'));
                node.classList.add('active');
                
                // 筛选列表
                const path = node.dataset.path;
                filterPostsByPath(path, posts);
            });
        });

        // 默认选中根目录
        const rootNode = document.querySelector('.tree-node-content[data-path=""]');
        if (rootNode) rootNode.classList.add('active');

        // 编辑按钮
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.edit-post-btn');
            if (btn) {
                const path = btn.dataset.path;
                window.location.hash = `posts/edit?path=${encodeURIComponent(path)}`;
            }
        });

        // 删除按钮
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('.delete-post-btn');
            if (btn) {
                const path = btn.dataset.path;
                if (confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
                    try {
                        const response = await fetchWithTimeout(`${getApiBase()}/posts?path=${encodeURIComponent(path)}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            showToast('删除成功', 'success');
                            // 刷新列表
                            renderPosts().then(html => {
                                document.getElementById('page-content').innerHTML = html;
                            });
                        } else {
                            const err = await response.json();
                            showToast(`删除失败: ${err.error || '未知错误'}`, 'error');
                        }
                    } catch (e) {
                        showToast('无法连接到后端服务', 'error');
                    }
                }
            }
        });

        // 新建按钮
        const createBtn = document.getElementById('create-post-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                showCreatePostModal();
            });
        }
        
        // 初始渲染所有文章
        renderPostTable(posts);
    }, 100);

    return `
        <div style="display: flex; gap: 20px; height: calc(100vh - 100px);">
            <!-- 左侧目录树 -->
            <div class="card" style="width: 280px; display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-header">
                    <h3 class="card-title">目录结构</h3>
                </div>
                <div class="tree-container" style="flex: 1; overflow-y: auto; padding: 12px;">
                    ${renderTree(tree)}
                </div>
            </div>

            <!-- 右侧文章列表 -->
            <div class="card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">文章管理</h3>
                    <button id="create-post-btn" class="btn btn-primary">
                        <i class="ph ph-plus"></i> 新建文章
                    </button>
                </div>
                <div style="flex: 1; overflow-y: auto; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; background: white; z-index: 10;">
                                <th style="padding: 12px 16px; color: #6b7280; font-weight: 500;">标题 / 路径</th>
                                <th style="padding: 12px 16px; color: #6b7280; font-weight: 500;">日期</th>
                                <th style="padding: 12px 16px; color: #6b7280; font-weight: 500;">状态</th>
                                <th style="padding: 12px 16px; color: #6b7280; font-weight: 500;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="posts-table-body">
                            <!-- 列表内容由 JS 动态渲染 -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <style>
            .tree-node {
                list-style: none;
                padding-left: 20px;
            }
            .tree-root {
                padding-left: 0;
            }
            .tree-node-content {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                cursor: pointer;
                border-radius: 4px;
                color: #374151;
                transition: all 0.2s;
            }
            .tree-node-content:hover {
                background: #f3f4f6;
            }
            .tree-node-content.active {
                background: #e0f2fe;
                color: #0284c7;
            }
            .tree-icon {
                margin-right: 6px;
                color: #9ca3af;
                font-size: 1.1em;
            }
            .tree-children {
                display: none;
            }
            .tree-node.expanded > .tree-children {
                display: block;
            }
            .tree-arrow {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 4px;
                transition: transform 0.2s;
                opacity: 0.6;
            }
            .tree-node.expanded > .tree-node-content > .tree-arrow {
                transform: rotate(90deg);
            }
            .tree-label {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        </style>
    `;
}

// 构建目录树
function buildDirectoryTree(posts, config) {
    // 根节点现在是一个虚拟节点，包含多个顶层目录作为子节点
    const root = { name: '全部文章', path: '', type: 'root', children: {} };
    
    // 默认的 content 目录（通常对应 posts）
    // 但根据现在的逻辑，posts 可能直接位于根目录下，或者在 content/posts 下
    // 我们需要根据路径的前缀来判断属于哪个顶层目录
    
    // 获取配置中的额外目录
    let rootDirs = ['content']; // 默认包含 content
    if (config && config.params && config.params.content && config.params.content.additionalDocs) {
        rootDirs = rootDirs.concat(config.params.content.additionalDocs);
    }
    
    // 规范化 rootDirs，去除可能的路径分隔符
    rootDirs = rootDirs.map(d => d.replace(/^\/|\/$/g, ''));

    posts.forEach(post => {
        const parts = post.path.split('/');
        // 移除文件名，只保留目录
        parts.pop();
        
        let current = root;
        let currentPath = '';
        
        // 尝试匹配顶层目录
        // 注意：后端返回的 path 已经是相对于某个 rootDir 的相对路径，或者是相对于项目根目录的相对路径
        // 在 posts.go 中，如果使用了 BaseDir 计算相对路径，那么 path 就会包含 rootDir 的前缀 (例如 hugo-teek-site/content/posts/a.md)
        // 或者 docs/b.md
        
        parts.forEach(part => {
            if (!current.children[part]) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                current.children[part] = {
                    name: part,
                    path: currentPath,
                    type: 'dir',
                    children: {}
                };
            }
            current = current.children[part];
        });
    });
    
    return root;
}

// 渲染目录树 HTML
function renderTree(node) {
    const hasChildren = Object.keys(node.children).length > 0;
    const arrow = hasChildren 
        ? '<i class="ph ph-caret-right tree-arrow"></i>' 
        : '<span class="tree-arrow"></span>';
    
    const icon = node.type === 'root' 
        ? '<i class="ph ph-house tree-icon"></i>'
        : '<i class="ph ph-folder tree-icon"></i>';
        
    let html = `
        <div class="tree-node ${node.type === 'root' ? 'expanded' : ''}">
            <div class="tree-node-content" data-path="${node.path}">
                ${arrow}
                ${icon}
                <span class="tree-label">${node.name}</span>
            </div>
    `;
    
    if (hasChildren) {
        html += `<div class="tree-children">`;
        Object.values(node.children).forEach(child => {
            html += renderTree(child);
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

// 根据路径筛选文章
function filterPostsByPath(path, posts) {
    const filtered = path 
        ? posts.filter(post => post.path.startsWith(path + '/') || post.path === path)
        : posts;
    renderPostTable(filtered);
}

// 渲染文章表格内容
function renderPostTable(posts) {
    const tbody = document.getElementById('posts-table-body');
    if (!tbody) return;
    
    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #6b7280;">暂无文章</td></tr>';
        return;
    }
    
    tbody.innerHTML = posts.map(post => `
        <tr>
            <td>
                <div style="font-weight: 500; color: #111827;">${post.title || '无标题'}</div>
                <div style="font-size: 0.85rem; color: #6b7280;">${post.path}</div>
            </td>
            <td>${post.date || '-'}</td>
            <td>
                ${post.draft 
                    ? '<span style="padding: 2px 8px; border-radius: 99px; background: #fef3c7; color: #d97706; font-size: 0.75rem;">草稿</span>' 
                    : '<span style="padding: 2px 8px; border-radius: 99px; background: #d1fae5; color: #059669; font-size: 0.75rem;">已发布</span>'}
            </td>
            <td>
                <button class="btn btn-sm edit-post-btn" data-path="${post.path}" style="padding: 4px 8px;">
                    <i class="ph ph-pencil-simple"></i> 编辑
                </button>
                <button class="btn btn-sm delete-post-btn" data-path="${post.path}" style="padding: 4px 8px; color: #ef4444;">
                    <i class="ph ph-trash"></i> 删除
                </button>
            </td>
        </tr>
    `).join('');
}

// 显示新建文章弹窗
function showCreatePostModal() {
    // 移除已存在的弹窗
    const existingModal = document.getElementById('create-post-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div id="create-post-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div class="card" style="width: 500px; max-width: 90%;">
                <div class="card-header">
                    <h3 class="card-title">新建文章</h3>
                </div>
                <div style="padding: 24px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">标题</label>
                        <input type="text" id="new-post-title" class="form-control" placeholder="输入文章标题">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">路径 (可选)</label>
                        <input type="text" id="new-post-path" class="form-control" placeholder="posts/my-new-post.md">
                        <small style="color: #6b7280;">默认将根据标题生成路径</small>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
                        <button id="cancel-create-btn" class="btn btn-secondary">取消</button>
                        <button id="confirm-create-btn" class="btn btn-primary">创建</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定事件
    document.getElementById('cancel-create-btn').addEventListener('click', () => {
        document.getElementById('create-post-modal').remove();
    });

    document.getElementById('confirm-create-btn').addEventListener('click', async () => {
        const title = document.getElementById('new-post-title').value.trim();
        let path = document.getElementById('new-post-path').value.trim();

        if (!title) {
            showToast('请输入文章标题', 'error');
            return;
        }

        if (!path) {
            // 简单的 slugify
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            path = `posts/${slug}.md`;
        } else if (!path.endsWith('.md')) {
            path += '.md';
        }

        // 创建初始内容
        const date = new Date().toISOString().split('T')[0];
        const content = `+++
title = '${title}'
date = ${date}
draft = true
+++

这里是文章内容...
`;

        try {
            const response = await fetchWithTimeout(`${getApiBase()}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: path,
                    content: content
                })
            });

            if (response.ok) {
                showToast('文章创建成功', 'success');
                document.getElementById('create-post-modal').remove();
                // 刷新列表
                renderPosts().then(html => {
                    document.getElementById('page-content').innerHTML = html;
                });
                // 跳转到编辑页
                window.location.hash = `posts/edit?path=${encodeURIComponent(path)}`;
            } else {
                const err = await response.json();
                showToast(`创建失败: ${err.error || '未知错误'}`, 'error');
            }
        } catch (e) {
            showToast('无法连接到后端服务', 'error');
        }
    });
}

// 全局编辑器实例
let currentEditor = null;
let currentFMEditor = null;

// 渲染文章编辑器 (新版 Vditor)
async function renderPostEditor(path) {
    if (!path) {
        showToast('未指定文章路径', 'error');
        window.location.hash = '#posts';
        return '';
    }

    try {
        // 获取文章内容
        const response = await fetchWithTimeout(`${getApiBase()}/posts/detail?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.content) {
            throw new Error('文章内容为空');
        }

        const content = data.content;

        // 解析 Front Matter 和正文
        const { frontMatter, body } = parseFrontMatter(content);

        // 销毁旧实例
        if (currentEditor) {
            currentEditor.destroy();
            currentEditor = null;
        }
        if (currentFMEditor) {
            currentFMEditor.destroy();
            currentFMEditor = null;
        }

        // 渲染 HTML（不包含编辑器初始化）
        const html = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button id="back-btn" class="btn">
                            <i class="ph ph-arrow-left"></i>
                        </button>
                        <div>
                            <h3 class="card-title">编辑文章</h3>
                            <p style="color: #6b7280; font-size: 0.9rem; margin-top: 4px;">${escapeHtml(path)}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="restore-draft-btn" class="btn" style="display: none;">
                            <i class="ph ph-clock-counter-clockwise"></i> 恢复草稿
                        </button>
                        <button id="save-post-btn" class="btn btn-primary">
                            <i class="ph ph-floppy-disk"></i> 保存
                        </button>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <!-- Front Matter 编辑器 -->
                    <div id="frontmatter-container"></div>

                    <!-- Markdown 编辑器 -->
                    <div id="vditor-container"></div>
                </div>
            </div>
        `;

        // 延迟初始化编辑器（等待 DOM 渲染）
        setTimeout(() => {
            initEditors(path, frontMatter, body);
        }, 100);

        return html;

    } catch (error) {
        console.error('加载文章失败:', error);
        showToast('加载文章失败: ' + error.message, 'error');
        return `
            <div class="card">
                <div class="loading-state">
                    <i class="ph ph-warning-circle" style="font-size: 48px; color: #ef4444;"></i>
                    <h3>加载失败</h3>
                    <p>${escapeHtml(error.message)}</p>
                    <button class="btn btn-primary" onclick="window.location.hash='posts'">返回列表</button>
                </div>
            </div>
        `;
    }
}

// 初始化编辑器
async function initEditors(path, frontMatter, body) {
    // 初始化 Front Matter 编辑器
    try {
        currentFMEditor = new FrontMatterEditor('#frontmatter-container', {
            value: frontMatter,
            onChange: (fm) => {
                console.log('Front Matter changed:', fm);
            }
        });
    } catch (error) {
        console.error('Front Matter 编辑器初始化失败:', error);
        showToast('Front Matter 编辑器初始化失败', 'warning');
    }

    // 检查是否有草稿
    const draftKey = `draft-${path}`;
    const draftContent = localStorage.getItem(draftKey);
    const draftTime = localStorage.getItem(`${draftKey}-time`);

    if (draftContent && draftTime) {
        const btn = document.getElementById('restore-draft-btn');
        if (btn) {
            btn.style.display = 'block';
            btn.onclick = () => {
                const timeStr = new Date(draftTime).toLocaleString('zh-CN');
                if (confirm(`发现 ${timeStr} 的自动保存草稿，是否恢复？`)) {
                    if (currentEditor) {
                        currentEditor.setValue(draftContent);
                    }
                    localStorage.removeItem(draftKey);
                    localStorage.removeItem(`${draftKey}-time`);
                    btn.style.display = 'none';
                    showToast('草稿已恢复', 'success');
                }
            };
        }
    }

    // 初始化 Vditor 编辑器
    try {
        currentEditor = new MarkdownEditor('#vditor-container', {
            value: body,
            uploadUrl: `${getApiBase()}/upload`,
            onChange: (content) => {
                // 自动保存在 MarkdownEditor 内部处理
            }
        });
    } catch (error) {
        console.error('Vditor 编辑器初始化失败:', error);
        showToast('编辑器初始化失败，请刷新页面重试', 'error');
    }

    // 绑定保存按钮
    const saveBtn = document.getElementById('save-post-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            await savePost(path);
        };
    }

    // 绑定返回按钮
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            const hasUnsaved = localStorage.getItem(`draft-${path}`);
            if (hasUnsaved) {
                if (confirm('确定要离开吗？未保存的更改将丢失。')) {
                    window.location.hash = '#posts';
                }
            } else {
                window.location.hash = '#posts';
            }
        };
    }
}

// 解析 Front Matter
function parseFrontMatter(content) {
    const yamlRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const tomlRegex = /^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/;

    let match = content.match(yamlRegex);
    if (match) {
        try {
            return {
                frontMatter: {
                    type: 'yaml',
                    raw: match[1],
                    data: jsyaml.load(match[1]) || {}
                },
                body: match[2]
            };
        } catch (error) {
            console.error('YAML 解析失败:', error);
        }
    }

    match = content.match(tomlRegex);
    if (match) {
        try {
            return {
                frontMatter: {
                    type: 'toml',
                    raw: match[1],
                    data: TOML.parse(match[1]) || {}
                },
                body: match[2]
            };
        } catch (error) {
            console.error('TOML 解析失败:', error);
        }
    }

    // 没有 Front Matter
    return {
        frontMatter: { type: 'yaml', raw: '', data: {} },
        body: content
    };
}

// 保存文章
async function savePost(path) {
    try {
        showToast('正在保存...', 'info');

        // 获取 Front Matter
        const fm = currentFMEditor ? currentFMEditor.getValue() : null;

        // 获取正文
        const body = currentEditor ? currentEditor.getValue() : '';

        // 组合完整内容
        let fullContent = body;

        if (fm && fm.data && Object.keys(fm.data).length > 0) {
            if (fm.type === 'yaml') {
                const yamlStr = jsyaml.dump(fm.data, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true
                });
                fullContent = `---\n${yamlStr}---\n${body}`;
            } else if (fm.type === 'toml') {
                const tomlStr = TOML.stringify(fm.data);
                fullContent = `+++\n${tomlStr}+++\n${body}`;
            }
        }

        // 发送保存请求
        const response = await fetchWithTimeout(`${getApiBase()}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content: fullContent })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('保存成功！', 'success');
            // 清除草稿
            localStorage.removeItem(`draft-${path}`);
            localStorage.removeItem(`draft-${path}-time`);

            // 隐藏恢复按钮
            const restoreBtn = document.getElementById('restore-draft-btn');
            if (restoreBtn) {
                restoreBtn.style.display = 'none';
            }
        } else {
            throw new Error(result.error || '保存失败');
        }
    } catch (error) {
        console.error('保存失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// HTML 转义
function escapeHtml(text) {
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

// 渲染占位页面 (用于尚未开发的模块)
function renderPlaceholder(title) {
    return `
        <div class="card">
            <div class="loading-state">
                <i class="ph ph-cone" style="font-size: 48px; margin-bottom: 16px; color: var(--primary-color);"></i>
                <h3>${title}</h3>
                <p>该功能正在开发中...</p>
            </div>
        </div>
    `;
}

// 渲染 404
function render404() {
    return `
        <div class="loading-state">
            <h3>404 - 页面未找到</h3>
            <p>请检查 URL 是否正确</p>
        </div>
    `;
}

// 全局 Toast 提示
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'warning-circle';

    toast.innerHTML = `
        <i class="ph ph-${icon}" style="font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
