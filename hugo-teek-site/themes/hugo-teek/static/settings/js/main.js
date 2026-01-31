// 依赖全局变量：API_BASE
// 由 single.html 注入
const API_BASE = window.API_BASE;

let currentView = 'dashboard';
let currentArticle = null;
let easyMDE = null;

// 侧边栏折叠功能
function toggleSidebar() {
    const sidebar = document.getElementById('cms-sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');

    // 保存折叠状态到 localStorage
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// 恢复侧边栏折叠状态
function restoreSidebarState() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        document.getElementById('cms-sidebar').classList.add('collapsed');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // 恢复侧边栏状态
    restoreSidebarState();

    // 从 URL获取当前视图
    const hash = window.location.hash.slice(1) || 'dashboard';
    loadView(hash);
    
    // Menu click handlers
    document.querySelectorAll('.cms-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            window.location.hash = view;
        });
    });
    
    // 监听hash变化
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        loadView(hash);
    });
});

// Load different views
function loadView(view) {
    currentView = view;
    const content = document.getElementById('cms-content');
    const title = document.getElementById('page-title');
    
    // 更新菜单激活状态
    document.querySelectorAll('.cms-menu-item').forEach(item => {
        if (item.dataset.view === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    switch(view) {
        case 'dashboard':
            title.textContent = '仪表盘';
            loadDashboard();
            break;
        case 'content/articles':
            title.textContent = '文章管理';
            loadArticles();
            break;
        default:
            if (view.startsWith('content/')) {
                title.textContent = '内容管理';
                content.innerHTML = `<div class="cms-content"><h3>${view}</h3><p>此功能正在开发中...</p></div>`;
            } else if (view.startsWith('appearance/')) {
                title.textContent = '外观设置';
                content.innerHTML = `<div class="cms-content"><h3>${view}</h3><p>此功能正在开发中...</p></div>`;
            } else {
                title.textContent = '系统设置';
                content.innerHTML = `<div class="cms-content"><h3>${view}</h3><p>此功能正在开发中...</p></div>`;
            }
    }
}

// Load Dashboard
function loadDashboard() {
    const content = document.getElementById('cms-content');
    content.innerHTML = `
        <div class="form-row">
            <div class="item-card">
                <h3>文章总数</h3>
                <div style="font-size: 36px; font-weight: bold; color: #3b82f6; margin-top: 10px;">
                    <span id="stat-articles">...</span>
                </div>
            </div>
            <div class="item-card">
                <h3>页面总数</h3>
                <div style="font-size: 36px; font-weight: bold; color: #10b981; margin-top: 10px;">
                    <span id="stat-pages">...</span>
                </div>
            </div>
            <div class="item-card">
                <h3>草稿</h3>
                <div style="font-size: 36px; font-weight: bold; color: #f59e0b; margin-top: 10px;">
                    <span id="stat-drafts">...</span>
                </div>
            </div>
            <div class="item-card">
                <h3>标签</h3>
                <div style="font-size: 36px; font-weight: bold; color: #8b5cf6; margin-top: 10px;">
                    <span id="stat-tags">...</span>
                </div>
            </div>
        </div>
        
        <div class="item-card" style="margin-top: 20px;">
            <h3>最近更新</h3>
            <div id="recent-articles">加载中...</div>
        </div>
    `;
    
    // Fetch stats
    fetchStats();
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/posts`);
        if (response.ok) {
            const res = await response.json();
            const articles = res.data || [];
            const drafts = articles.filter(a => a.draft).length;
            const tags = new Set();
            articles.forEach(a => (a.tags || []).forEach(t => tags.add(t)));
            
            document.getElementById('stat-articles').textContent = articles.length;
            document.getElementById('stat-drafts').textContent = drafts;
            document.getElementById('stat-tags').textContent = tags.size;
            document.getElementById('stat-pages').textContent = '-'; // Need pages API
            
            // Recent articles
            const recent = articles.slice(0, 5);
            const recentHtml = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>标题</th>
                            <th>日期</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td>${a.date}</td>
                                <td>${a.draft ? '<span class="tag draft-badge">草稿</span>' : '<span class="tag" style="background:#d1fae5;color:#065f46">已发布</span>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('recent-articles').innerHTML = recentHtml;
        }
    } catch (e) {
        console.error('Failed to fetch stats:', e);
    }
}

// Load Articles
async function loadArticles() {
    const content = document.getElementById('cms-content');
    content.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/posts`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        const res = await response.json();
        const articles = res.data || [];
        
        const html = `
            <div class="articles-header">
                <h2>文章列表</h2>
                <button class="btn btn-primary" onclick="createArticle()">+ 新建文章</button>
            </div>
            
            <div class="articles-table">
                <table>
                    <thead>
                        <tr>
                            <th>标题</th>
                            <th>日期</th>
                            <th>标签</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${articles.map(article => `
                            <tr>
                                <td>
                                    <div class="article-title">${article.title}</div>
                                    <div class="article-meta">${article.path}</div>
                                </td>
                                <td>${article.date}</td>
                                <td>
                                    ${(article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                                </td>
                                <td>
                                    ${article.draft ? '<span class="tag draft-badge">草稿</span>' : '<span class="tag" style="background:#d1fae5;color:#065f46">已发布</span>'}
                                </td>
                                <td>
                                    <button class="btn btn-small btn-primary" onclick="editArticle('${article.path}')">编辑</button>
                                    <button class="btn btn-small btn-danger" onclick="deleteArticle('${article.path}')">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        content.innerHTML = html;
    } catch (error) {
        console.error('Failed to load articles:', error);
        content.innerHTML = `<div class="error">
            <h3>数据加载失败</h3>
            <p>错误信息: ${error.message}</p>
            <p>API地址: ${API_BASE}/posts</p>
            <p>请确保后端服务已启动，且端口配置正确。</p>
        </div>`;
    }
}

// Edit article
async function editArticle(path) {
    const content = document.getElementById('cms-content');
    content.innerHTML = '<div class="loading">加载文章内容...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/posts/detail?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        const res = await response.json();
        currentArticle = res.data;
        renderArticleEditor();
    } catch (error) {
        content.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Create article
function createArticle() {
    currentArticle = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        draft: true,
        content: '',
        path: '',
        frontMatter: {}
    };
    renderArticleEditor();
}

// Render article editor
function renderArticleEditor() {
    const content = document.getElementById('cms-content');
    
    const html = `
        <div class="articles-header">
            <h2>编辑文章</h2>
            <div>
                <button class="btn btn-primary" onclick="saveArticle()">💾 保存</button>
                <button class="btn" onclick="window.location.hash='content/articles'">取消</button>
            </div>
        </div>
        
        <div id="save-message"></div>
        
        <div class="editor-container">
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <label class="form-label">标题</label>
                    <input type="text" class="form-input" id="article-title" value="${currentArticle.title || ''}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">日期</label>
                    <input type="text" class="form-input" id="article-date" value="${currentArticle.date || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">标签 (逗号分隔)</label>
                <input type="text" class="form-input" id="article-tags" value="${(currentArticle.tags || []).join(', ')}">
            </div>
            
            <div class="form-group">
                <label class="form-label">内容 (Markdown)</label>
                <textarea id="article-content">${currentArticle.content || ''}</textarea>
            </div>
        </div>
    `;
    
    content.innerHTML = html;

    // 初始化 EasyMDE
    if (typeof EasyMDE !== 'undefined') {
        easyMDE = new EasyMDE({
            element: document.getElementById('article-content'),
            spellChecker: false,
            autosave: {
                enabled: true,
                uniqueId: "article_" + (currentArticle.path || 'new').replace(/[^a-zA-Z0-9]/g, '_'),
                delay: 1000,
            },
            toolbar: [
                "bold", "italic", "heading", "|", 
                "quote", "unordered-list", "ordered-list", "|", 
                "link", "image", "table", "code", "|", 
                "preview", "side-by-side", "fullscreen", "|", 
                "guide"
            ],
            status: ["autosave", "lines", "words", "cursor"],
            minHeight: "500px",
            maxHeight: "800px",
            renderingConfig: {
                singleLineBreaks: false,
                codeSyntaxHighlighting: true,
            },
        });
    } else {
        console.warn('EasyMDE failed to load');
        const textarea = document.getElementById('article-content');
        textarea.style.height = '500px';
        textarea.style.width = '100%';
        textarea.style.fontFamily = 'monospace';
        textarea.style.padding = '1rem';
        textarea.classList.add('form-input');
    }
}

// Save article
async function saveArticle() {
    const title = document.getElementById('article-title').value;
    const date = document.getElementById('article-date').value;
    const tags = document.getElementById('article-tags').value.split(',').map(t => t.trim()).filter(t => t);
    const content = easyMDE ? easyMDE.value() : document.getElementById('article-content').value;
    
    // Update article
    currentArticle.title = title;
    currentArticle.date = date;
    currentArticle.tags = tags;
    currentArticle.content = content;
    currentArticle.frontMatter = currentArticle.frontMatter || {};
    currentArticle.frontMatter.title = title;
    currentArticle.frontMatter.date = date;
    currentArticle.frontMatter.tags = tags;
    
    // If new article, generate path
    if (!currentArticle.path) {
        // Simple slug generation
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        currentArticle.path = `posts/${slug}.md`;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: currentArticle.path,
                content: generatePostContent(currentArticle)
            })
        });
        
        if (response.ok) {
            document.getElementById('save-message').innerHTML = '<div class="success">✅ 保存成功！</div>';
            // 清除自动保存
            if (easyMDE) {
                easyMDE.clearAutosavedValue();
            }
            setTimeout(() => {
                document.getElementById('save-message').innerHTML = '';
            }, 3000);
        } else {
            throw new Error('保存失败');
        }
    } catch (error) {
        document.getElementById('save-message').innerHTML = `<div class="error">❌ 保存失败: ${error.message}</div>`;
    }
}

// Generate full post content with Front Matter
function generatePostContent(article) {
    const fm = {
        title: article.title,
        date: article.date,
        tags: article.tags,
        draft: article.draft
    };
    
    // Merge other existing front matter if any
    if (article.frontMatter) {
        Object.assign(fm, article.frontMatter);
    }
    
    // Simple YAML stringify
    let yaml = '---\n';
    for (const [key, value] of Object.entries(fm)) {
        if (Array.isArray(value)) {
            yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
        } else if (typeof value === 'boolean') {
            yaml += `${key}: ${value}\n`;
        } else {
            yaml += `${key}: "${value}"\n`;
        }
    }
    yaml += '---\n\n';
    
    return yaml + article.content;
}

// Delete article
async function deleteArticle(path) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return;
    
    try {
        const response = await fetch(`${API_BASE}/posts?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadArticles(); // Reload list
        } else {
            alert('删除失败');
        }
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}
