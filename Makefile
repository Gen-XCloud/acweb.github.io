.PHONY: help dev build clean check-bins install-tools download-tools fix-frontmatter gen-permalink gen-sidebar-order gen-index gen-doc-analysis gen-vp-convert start-config remove-coverimg rebuild-data stop-content-watcher cleanup-dev quick build-docker docker-build docker-build-ci docker-run docker-push check-version clean-keep-index rebuild-fast build-fastest build-optimized

# 默认目标
help:
	@echo "Hugo Teek 文档库构建工具"
	@echo ""
	@echo "主要命令:"
	@echo "  make dev            - 启动开发服务器（含搜索功能、配置中心、内容监听）"
	@echo "  make quick          - 快速启动（跳过预生成和搜索索引）"
	@echo "  make build          - 构建生产版本（本地环境）"
	@echo "  make build-docker   - 构建生产版本（Docker 容器环境）"
	@echo "  make clean          - 清理构建文件"
	@echo ""
	@echo "⚡ 性能优化命令（推荐）:"
	@echo "  make build-optimized - 标准构建（含优化后的搜索索引，~60秒）"
	@echo "  make build-fastest   - 极速构建（跳过非必要步骤，无搜索，~10秒）"
	@echo "  make rebuild-fast    - 快速重建（复用搜索索引，仅~12秒）"
	@echo "  make clean-keep-index- 清理但保留搜索索引（增量构建用）"
	@echo ""
	@echo "主题切换 (配置驱动，无需手动判断):"
	@echo "  1. 编辑 hugo-teek-site/config/_default/hugo.toml 修改 theme 字段"
	@echo "  2. 运行 make dev （自动检测主题并根据配置决定功能）"
	@echo "  3. 或手动指定: make dev THEME=主题名"
	@echo "  当前主题: $(THEME) $(if $(DETECTED_THEME),(自动检测),(默认值))"
	@echo "  搜索功能: 由主题配置的 [search].enabled 决定"
	@echo ""
	@echo "数据生成命令:"
	@echo "  make fix-frontmatter    - 修复缺失的 Front Matter"
	@echo "  make gen-permalink      - 生成 SEO 友好的 permalink"
	@echo "  make gen-sidebar-order  - 生成侧边栏排序数据"
	@echo "  make gen-index          - 生成索引页"
	@echo "  make gen-doc-analysis   - 生成文档分析数据（字数、阅读时间）"
	@echo "  make gen-vp-convert     - 转换 VitePress 语法为 Hugo 语法"
	@echo "  make rebuild-data       - 重新生成所有数据（开发时使用）"
	@echo ""
	@echo "工具命令:"
	@echo "  make install-tools       - 编译安装构建工具"
	@echo "  make check-bins          - 检查构建工具是否就绪"
	@echo "  make remove-coverimg     - 删除所有 MD 文件的 coverImg 字段"
	@echo "  make stop-content-watcher - 停止内容监听器"
	@echo ""
	@echo "Docker 命令:"
	@echo "  make download-tools      - 下载 Hugo（FlexSearch 索引已集成）"
	@echo "  make docker-build        - 构建 Docker 镜像（使用本地二进制）"
	@echo "  make docker-build-ci     - 构建 Docker 镜像（CI 专用，完全自包含）✨"
	@echo "  make docker-run          - 运行 Docker 容器测试构建"
	@echo "  make docker-push         - 推送 Docker 镜像"
	@echo "  make docker-release      - 构建并推送（CI/CD 常用）"
	@echo ""
	@echo "🆕 现已使用统一工具: hugo-teek-tools"
	@echo "   Linux:   bin/linux/hugo-teek-tools"
	@echo "   Windows: bin\\windows\\hugo-teek-tools.exe"
	@echo ""
	@echo "📚 文档:"
	@echo "   工具文档:    tools/README.md"
	@echo "   Docker:      docker/README.md"
	@echo "   CI/CD:       CI_CD_GUIDE.md"
	@echo "   Windows:     WINDOWS_GUIDE.md | bin/windows/README.md"
	@echo ""

# 工具二进制目录
BIN_DIR = bin/linux
TOOLS_BIN = $(BIN_DIR)/hugo-teek-tools

# Hugo 配置（使用标准 config/ 目录结构 + 环境目录）
# 主题切换通过 --environment 参数实现
# 自动从 config/_default/hugo.toml 检测主题（如果未手动指定）
DETECTED_THEME := $(shell grep '^theme = ' hugo-teek-site/config/_default/hugo.toml 2>/dev/null | sed 's/.*["'\'']\(.*\)["'\''].*/\1/' | head -1)
THEME ?= $(if $(DETECTED_THEME),$(DETECTED_THEME),hugo-teek)
HUGO_ENV = --environment=$(THEME)

# 自动检测主题是否启用搜索功能（从合并后的 params.toml 读取配置）
# 注意：需要在 merge-config 之后才能读取到正确的值
SEARCH_ENABLED = $(shell grep -A 1 '^\[search\]' hugo-teek-site/config/_default/params.toml 2>/dev/null | grep 'enabled = true' >/dev/null && echo "yes" || echo "no")

# 端口配置
FRONTEND_PORT ?= 8090
# 尝试从 teektools.toml 读取后端端口，默认 8888
BACKEND_PORT ?= $(shell grep "port =" hugo-teek-site/config/teek-plugins/teektools.toml 2>/dev/null | head -1 | awk -F'=' '{print $$2}' | tr -d ' ' || echo 8888)

# 清理端口占用（仅清理前端端口，保留配置中心服务）
clean-ports:
	@echo "🧹 检查并清理端口占用..."
	@# 只清理前端端口，保留配置中心服务 (8888)
	@if command -v lsof >/dev/null 2>&1; then \
		PID=$$(lsof -ti :$(FRONTEND_PORT)); \
		if [ -n "$$PID" ]; then \
			echo "   - 释放前端端口 $(FRONTEND_PORT) (PID: $$PID)..."; \
			kill -9 $$PID 2>/dev/null || true; \
		fi; \
	else \
		echo "⚠️  lsof 未安装，尝试使用 fuser..."; \
		fuser -k $(FRONTEND_PORT)/tcp >/dev/null 2>&1 || true; \
	fi
	@echo "✅ 端口清理完成（配置中心服务端口 $(BACKEND_PORT) 已保留）"

# 安装构建工具
install-tools:
	@echo "🔨 编译安装 Hugo Teek Tools..."
	@cd tools && $(MAKE) install
	@echo "✅ 工具安装完成: $(TOOLS_BIN)"

# 检查工具二进制是否存在
check-bins:
	@if [ ! -d "$(BIN_DIR)" ]; then \
		echo "❌ 错误: $(BIN_DIR) 目录不存在"; \
		echo "   运行 'make install-tools' 安装构建工具"; \
		exit 1; \
	fi
	@if [ ! -f "$(TOOLS_BIN)" ]; then \
		echo "❌ 错误: 统一构建工具未找到"; \
		echo "   运行 'make install-tools' 安装 hugo-teek-tools"; \
		exit 1; \
	fi
	@echo "✅ 构建工具检查通过 (hugo-teek-tools)"

# 检查并更新工具版本
check-version:
	@if [ -f "bin/linux/check-version.sh" ]; then \
		bash bin/linux/check-version.sh; \
	fi

# 合并配置文件（teek-plugins + themes/{theme} → _default）
merge-config: check-bins
	@echo "⚙️  合并配置文件..."
	@$(TOOLS_BIN) config merge

# 修复缺失的 Front Matter
fix-frontmatter: check-bins
	@echo "🔧 检查和修复 Front Matter..."
	@$(TOOLS_BIN) frontmatter

# 生成 permalink
gen-permalink: check-bins
	@echo "🔗 生成 permalink..."
	@$(TOOLS_BIN) permalink

# 生成侧边栏排序数据
gen-sidebar-order: check-bins
	@echo "📊 生成侧边栏排序数据..."
	@$(TOOLS_BIN) sidebar
	@echo "📋 复制侧边栏数据到 static 目录..."
	@mkdir -p hugo-teek-site/static/data/sidebar
	@if [ -d "hugo-teek-site/data/sidebar" ]; then \
		cp -r hugo-teek-site/data/sidebar/* hugo-teek-site/static/data/sidebar/; \
		echo "   ✅ 已复制拆分侧边栏数据 (data/sidebar/ → static/data/sidebar/)"; \
	fi

# 生成侧边栏数据并拆分（优化版）
.PHONY: gen-sidebar-split
gen-sidebar-split: gen-sidebar-order
	@echo "📋 复制侧边栏数据到 static 目录..."
	@mkdir -p hugo-teek-site/static/data/sidebar
	@if [ -d "hugo-teek-site/data/sidebar" ]; then \
		cp -r hugo-teek-site/data/sidebar/* hugo-teek-site/static/data/sidebar/; \
		echo "   ✅ 已复制拆分侧边栏数据 (data/sidebar/ → static/data/sidebar/)"; \
	fi

# 生成索引页
gen-index: check-bins
	@echo "📄 生成索引页..."
	@$(TOOLS_BIN) index

# 生成 FlexSearch 搜索索引
gen-search-index: check-bins
	@echo "🔍 生成 FlexSearch 搜索索引..."
	@$(TOOLS_BIN) search

# 生成文档分析数据
gen-doc-analysis: check-bins
	@echo "📊 生成文档分析数据..."
	@$(TOOLS_BIN) analysis

# 转换 VitePress 语法为 HTML（使用临时目录，智能符号链接）
gen-vp-convert: check-bins
	@echo "🔄 准备VitePress容器语法转换环境..."
	@rm -rf hugo-teek-site/.content-vp-converted
	@$(TOOLS_BIN) convert

# 开发模式（统一流程，配置驱动）
dev: clean-ports check-version clean merge-config fix-frontmatter gen-permalink gen-index gen-sidebar-split gen-vp-convert gen-doc-analysis gen-search-index
	@echo "🎨 当前主题: $(THEME) $(if $(DETECTED_THEME),(自动检测自 hugo.toml),(使用默认值))"
	@echo "   💡 提示: 可通过 'make dev THEME=主题名' 手动覆盖"
	@echo ""
	@# 根据主题配置决定是否生成搜索索引（FlexSearch 索引在数据生成阶段已完成）
	@SEARCH_CHECK=$$(grep -E '^\[(params\.)?search\]' hugo-teek-site/config/_default/params.toml 2>/dev/null | head -1 > /dev/null && \
		grep -A 3 -E '^\[(params\.)?search\]' hugo-teek-site/config/_default/params.toml 2>/dev/null | grep 'enabled = true' >/dev/null && echo "yes" || echo "no"); \
	if [ "$$SEARCH_CHECK" = "yes" ]; then \
		echo "🔍 搜索功能已启用（FlexSearch 索引已在数据生成阶段完成）"; \
		echo ""; \
	else \
		echo "💡 当前主题未启用搜索功能"; \
		echo ""; \
	fi
	@echo "🚀 启动 Hugo 开发服务器..."
	@echo "   📂 内容目录: .content-vp-converted（VitePress 语法已转换）"
	@echo "   💡 如需管理后台，请运行: make dev-admin"
	@echo ""
# @hugo server $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --bind=0.0.0.0 --port=$(FRONTEND_PORT) --templateMetrics   --templateMetricsHints
	@hugo server $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --bind=0.0.0.0 --port=$(FRONTEND_PORT)


# 启动配置中心服务
start-config:
	@echo "🚀 启动配置中心后端服务 (端口 $(BACKEND_PORT))..."
	@if [ -f .config-server.pid ]; then \
		PID=$$(cat .config-server.pid); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "⚠️  服务已在运行 (PID: $$PID)，正在重启..."; \
			kill $$PID 2>/dev/null || true; \
			rm .config-server.pid; \
		else \
			echo "⚠️  发现过期的 PID 文件 (PID: $$PID)，正在清理..."; \
			rm .config-server.pid; \
		fi; \
	fi
	@nohup $(TOOLS_BIN) server --port $(BACKEND_PORT) > .config-server.log 2>&1 & echo $$! > .config-server.pid
	@sleep 1
	@echo "✅ 后端服务已启动"

# 停止配置中心服务
stop-config:
	@echo "🛑 停止配置中心服务..."
	@if [ -f .config-server.pid ]; then \
		kill $$(cat .config-server.pid) 2>/dev/null || true; \
		rm .config-server.pid; \
		echo "✅ 服务已停止"; \
	fi

# 启动内容监听器（自动转换 VitePress 语法）（旧工具，待迁移）
start-content-watcher:
	@echo "👁️  启动内容监听器..."
	@if [ ! -f "$(BIN_DIR)/content-watcher" ]; then \
		echo "⚠️  content-watcher 未找到，跳过启动"; \
	else \
		if [ -f .content-watcher.pid ]; then \
			PID=$$(cat .content-watcher.pid); \
			if kill -0 $$PID 2>/dev/null; then \
				echo "⚠️  监听器已在运行 (PID: $$PID)，正在重启..."; \
				kill $$PID 2>/dev/null || true; \
				rm .content-watcher.pid; \
			else \
				echo "⚠️  发现过期的 PID 文件 (PID: $$PID)，正在清理..."; \
				rm .content-watcher.pid; \
			fi; \
		fi; \
		nohup $(BIN_DIR)/content-watcher $(CURDIR) > .content-watcher.log 2>&1 & echo $$! > .content-watcher.pid && \
		sleep 1 && \
		echo "✅ 内容监听器已启动（监听配置见 hugo.toml 的 params.development.watchDir）" && \
		echo "📋 日志文件: .content-watcher.log"; \
	fi

# 停止内容监听器
stop-content-watcher:
	@echo "🛑 停止内容监听器..."
	@if [ -f .content-watcher.pid ]; then \
		kill $$(cat .content-watcher.pid) 2>/dev/null || true; \
		rm .content-watcher.pid; \
		echo "✅ 内容监听器已停止"; \
	fi

# 清理开发资源
cleanup-dev:
	@$(MAKE) stop-content-watcher
	@$(MAKE) stop-config

# 本地生产构建(FlexSearch 索引在数据生成阶段已完成)
build: clean merge-config fix-frontmatter gen-permalink gen-index gen-sidebar-split gen-vp-convert gen-doc-analysis gen-search-index
	@echo "🏗️  构建生产版本..."
	@echo "   🎨 当前主题: $(THEME) $(if $(DETECTED_THEME),(自动检测自 hugo.toml),(使用默认值))"
	@hugo $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --minify
	@echo "🧹 清理遗留数据文件..."
	@rm -f hugo-teek-site/public/data/sidebarOrder.json && echo "   ✅ 已删除 sidebarOrder.json (863KB)" || true
	@echo "✅ 构建完成！输出目录: hugo-teek-site/public"

# docker镜像生产构建(容器内置 hugo, FlexSearch 索引在数据生成阶段完成)
build-docker:
	@echo "🏗️  Docker 容器内构建..."
	@DETECTED_THEME=$$(grep '^theme = ' /workspace/hugo-teek-site/config/_default/hugo.toml 2>/dev/null | sed 's/.*["'\'']\(.*\)["'\''].*/\1/' | head -1); \
	THEME=$${DETECTED_THEME:-hugo-teek}; \
	echo "   🎨 检测到主题: $$THEME"; \
	echo ""; \
	echo "🧹 [1/10] 清理旧文件..."; \
	/usr/bin/hugo-teek-tools clean --base-dir /workspace; \
	echo "🧹 清理自动生成的数据文件..."; \
	rm -rf /workspace/hugo-teek-site/data/sidebar; \
	rm -rf /workspace/hugo-teek-site/static/data/sidebar
	@echo ""
	@echo "⚙️  [2/10] 合并配置文件..."; \
	/usr/bin/hugo-teek-tools config merge --base-dir /workspace
	@echo ""
	@echo "🔧 [3/10] 修复 Front Matter..."
	@/usr/bin/hugo-teek-tools frontmatter --base-dir /workspace
	@echo ""
	@echo "🔗 [4/10] 生成 Permalink..."
	@/usr/bin/hugo-teek-tools permalink --base-dir /workspace
	@echo ""
	@echo "📄 [5/10] 生成索引页..."
	@/usr/bin/hugo-teek-tools index --base-dir /workspace
	@echo ""
	@echo "📊 [6/10] 生成侧边栏排序..."
	@/usr/bin/hugo-teek-tools sidebar --base-dir /workspace
	@echo "📋 复制侧边栏数据到 static 目录..."
	@mkdir -p /workspace/hugo-teek-site/static/data/sidebar
	@if [ -d "/workspace/hugo-teek-site/data/sidebar" ]; then \
		cp -r /workspace/hugo-teek-site/data/sidebar/* /workspace/hugo-teek-site/static/data/sidebar/; \
		echo "   ✅ 已复制拆分侧边栏数据 (data/sidebar/ → static/data/sidebar/)"; \
	fi
	@echo ""
	@echo "📋 验证侧边栏数据..."
	@if [ -d "/workspace/hugo-teek-site/data/sidebar" ]; then \
		echo "   ✅ 拆分模式侧边栏数据已生成 (data/sidebar/)"; \
		echo "   📊 文件数量: $$(ls /workspace/hugo-teek-site/data/sidebar/ | wc -l)"; \
		for file in /workspace/hugo-teek-site/data/sidebar/*.json; do \
			if [ -f "$$file" ]; then \
				FILE_SIZE=$$(ls -lh "$$file" | awk '{print $$5}'); \
				FILE_NAME=$$(basename "$$file"); \
				echo "      - $$FILE_NAME: $$FILE_SIZE"; \
			fi; \
		done; \
	else \
		echo "   ❌ 警告: 侧边栏数据未生成！"; \
		ls -la /workspace/hugo-teek-site/data/ || echo "   data 目录不存在"; \
	fi
	@echo ""
	@echo "🔄 [7/11] VitePress 语法转换..."
	@/usr/bin/hugo-teek-tools convert --base-dir /workspace
	@echo ""
	@echo "📊 [8/11] 文档分析..."
	@/usr/bin/hugo-teek-tools analysis --base-dir /workspace
	@echo ""
	@echo "🔍 [9/11] 生成搜索索引..."
	@/usr/bin/hugo-teek-tools search --base-dir /workspace
	@echo ""
	@echo "🏗️  [10/11] 构建站点..."
	@echo "📋 构建前检查..."
	@if [ -d "/workspace/hugo-teek-site/data/sidebar" ]; then \
		FILE_COUNT=$$(ls /workspace/hugo-teek-site/data/sidebar/*.json 2>/dev/null | wc -l); \
		if [ "$$FILE_COUNT" -gt "0" ]; then \
			echo "   ✅ 侧边栏数据已生成 ($$FILE_COUNT 个文件)"; \
			echo "   📋 关键文件检查:"; \
			if [ -f "/workspace/hugo-teek-site/data/sidebar/categories.json" ]; then \
				echo "      ✓ categories.json 存在"; \
			else \
				echo "      ✗ categories.json 缺失！"; \
				exit 1; \
			fi; \
		else \
			echo "   ❌ 错误: 侧边栏数据目录为空！"; \
			exit 1; \
		fi; \
	else \
		echo "   ❌ 错误: 侧边栏数据目录不存在！"; \
		exit 1; \
	fi
	@/usr/local/bin/hugo --environment=$$THEME --source=hugo-teek-site --contentDir=.content-vp-converted --minify
	@echo ""
	@echo "🧹 清理遗留数据文件..."
	@rm -f /workspace/hugo-teek-site/public/data/sidebarOrder.json && echo "   ✅ 已删除 sidebarOrder.json (863KB)" || true
	@echo ""
	@echo "✅ 构建完成！输出目录: hugo-teek-site/public"

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	@if [ -f "$(TOOLS_BIN)" ]; then \
		$(TOOLS_BIN) clean; \
	else \
		rm -rf hugo-teek-site/public; \
		rm -rf hugo-teek-site/resources; \
		rm -rf hugo-teek-site/.content-vp-converted; \
		rm -rf hugo-teek-site/config/_default/params.toml; \
	fi
	@echo "🧹 清理自动生成的数据文件..."
	@rm -rf hugo-teek-site/data/sidebar
	@rm -rf hugo-teek-site/static/data/sidebar
	@echo "✅ 清理完成"

# ============================================
# 性能优化相关命令
# ============================================

# 清理但保留搜索索引(增量构建用)
clean-keep-index:
	@echo "🧹 清理构建文件（保留 FlexSearch 索引）..."
	@if [ -f "hugo-teek-site/static/data/search/index.json" ]; then \
		echo "   💾 备份 FlexSearch 索引..."; \
		mkdir -p /tmp/flexsearch_backup; \
		cp -r hugo-teek-site/static/data/search /tmp/flexsearch_backup/; \
	fi
	@rm -rf hugo-teek-site/public
	@rm -rf hugo-teek-site/resources
	@rm -rf hugo-teek-site/.content-vp-converted
	@if [ -d "/tmp/flexsearch_backup/search" ]; then \
		mkdir -p hugo-teek-site/static/data; \
		echo "   ♻️  恢复 FlexSearch 索引..."; \
		mv /tmp/flexsearch_backup/search hugo-teek-site/static/data/search; \
		rm -rf /tmp/flexsearch_backup; \
	fi
	@echo "✅ 清理完成（FlexSearch 索引已保留）"

# 快速重建（开发模式，复用搜索索引）
rebuild-fast: clean-keep-index merge-config fix-frontmatter gen-permalink gen-sidebar-order gen-index gen-vp-convert gen-doc-analysis
	@echo "⚡ 快速重建（复用搜索索引）..."
	@hugo $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --minify
	@echo "✅ 快速重建完成！耗时仅需 Hugo 构建时间（约12秒）"

# 极速构建（跳过所有非必要步骤，无搜索索引）
build-fastest: clean merge-config gen-vp-convert
	@echo "🚀 极速构建模式（最小步骤）..."
	@hugo $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted
	@echo "⚡ 完成！输出目录: hugo-teek-site/public（无搜索索引）"

# 标准构建（含 FlexSearch 搜索索引）
build-optimized: clean merge-config fix-frontmatter gen-permalink gen-sidebar-order gen-index gen-vp-convert gen-doc-analysis gen-search-index
	@echo "🏗️  标准构建（含 FlexSearch 搜索）..."
	@hugo $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --minify
	@echo "✅ 构建完成！预计耗时 ~60秒"

# ============================================
# 原有命令
# ============================================

# 快速预览（跳过数据生成和搜索索引）
quick:
	@echo "⚡ 快速启动（跳过数据生成和搜索索引）..."
	@echo "   🎨 当前主题: $(THEME)"
	@hugo server $(HUGO_ENV) --source=hugo-teek-site --bind=0.0.0.0 --port=8090 --buildDrafts

# 重新生成数据和索引（开发服务器运行时使用）
rebuild-data:
	@echo "🔄 重新生成数据和索引..."
	@echo "⚙️  [1/6] 修复 Front Matter..."
	@$(MAKE) fix-frontmatter
	@echo "⚙️  [2/6] 生成 Permalink..."
	@$(MAKE) gen-permalink
	@echo "⚙️  [3/6] 生成索引页..."
	@$(MAKE) gen-index
	@echo "⚙️  [4/6] 生成侧边栏排序..."
	@$(MAKE) gen-sidebar-order
	@echo "⚙️  [5/6] 转换 VitePress 语法..."
	@$(MAKE) gen-vp-convert
	@echo "⚙️  [6/6] 生成文档分析..."
	@$(MAKE) gen-doc-analysis
	@echo "✅ 数据重新生成完成！Hugo 将自动检测变化并重新加载"

# 删除所有 MD 文件的 coverImg 字段（旧工具，待迁移）
remove-coverimg:
	@echo "🗑️  删除所有 MD 文件的 coverImg 字段..."
	@if [ -f "$(BIN_DIR)/remove-coverimg" ]; then \
		$(BIN_DIR)/remove-coverimg; \
	else \
		echo "⚠️  remove-coverimg 未找到"; \
	fi

# 使用新工具执行完整构建流程
build-new: check-bins
	@echo "🚀 使用 hugo-teek-tools 执行完整构建..."
	@$(TOOLS_BIN) build
	@echo "🏗️  构建站点..."
	@echo "   🎨 当前主题: $(THEME)"
	@hugo $(HUGO_ENV) --source=hugo-teek-site --contentDir=.content-vp-converted --minify
	@echo "✅ 构建完成！"

# ============================================
# Docker 相关命令
# ============================================

# Docker 镜像名称
DOCKER_IMAGE = yuwen-gueen/hugo-teek-site
DOCKER_TAG = latest

# 下载 Hugo
download-tools:
	@echo "📥 检查 Hugo..."
	@./scripts/download-tools.sh

# 使用本地二进制构建 Docker 镜像（需要预先编译好二进制）
docker-build: install-tools download-tools
	@echo "🐳 构建 Docker 镜像（使用本地二进制）..."
	@docker build -f docker/Dockerfile -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✅ Docker 镜像构建完成: $(DOCKER_IMAGE):$(DOCKER_TAG)"

# 使用多阶段构建（自动编译 hugo-teek-tools）
docker-build-multistage:
	@echo "🐳 构建 Docker 镜像（多阶段构建）..."
	@docker build -f docker/Dockerfile.multistage -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "✅ Docker 镜像构建完成: $(DOCKER_IMAGE):$(DOCKER_TAG)"

# 使用 CI 专用 Dockerfile（完全自包含）
docker-build-ci:
	@echo "🐳 构建 Docker 镜像（CI 完全自包含）..."
	@docker build -f docker/Dockerfile.ci \
		--build-arg HUGO_VERSION=0.151.0 \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) \
		.
	@echo "✅ Docker 镜像构建完成: $(DOCKER_IMAGE):$(DOCKER_TAG)"

# 运行 Docker 容器测试构建
docker-run:
	@echo "🚀 运行 Docker 容器进行构建测试..."
	@docker run --rm \
		-v $(CURDIR):/workspace \
		$(DOCKER_IMAGE):$(DOCKER_TAG)

# 推送 Docker 镜像
docker-push:
	@echo "📤 推送 Docker 镜像到仓库..."
	@docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	@echo "✅ 镜像推送完成"

# 构建并推送（CI/CD 常用）
docker-release: docker-build-ci docker-push
	@echo "✅ Docker 镜像发布完成"


# ============================================
# Admin 管理后台
# ============================================

# 安装前端依赖
admin-install:
	@echo "📦 安装前端依赖..."
	@if [ ! -d "admin-frontend/node_modules" ]; then \
		cd admin-frontend && npm install; \
	else \
		echo "✅ 依赖已安装，跳过"; \
	fi

# 开发模式（前后端同时启动）
dev-admin: admin-install
	@echo "🚀 启动 Admin 管理后台..."
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@# 后台启动后端（使用专门的启动脚本）
	@bash scripts/start-admin-server.sh &
	@echo $$! > .admin-server.pid
	@sleep 2
	@echo "✅ 后端服务: http://localhost:8888"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@# 前端开发服务器（阻塞）
	@cd admin-frontend && npm run dev || $(MAKE) stop-admin

# 停止 Admin 服务
stop-admin:
	@echo "🛑 停止 Admin 服务..."
	@if [ -f .admin-server.pid ]; then \
		kill $$(cat .admin-server.pid) 2>/dev/null || true; \
		rm .admin-server.pid; \
		echo "✅ 服务已停止"; \
	fi

# 构建前端
admin-build-frontend:
	@echo "🏗️  构建前端..."
	@cd admin-frontend && npm run build
	@echo "✅ 前端构建完成: admin-frontend/dist"

# 嵌入前端到后端
admin-embed: admin-build-frontend
	@echo "📦 嵌入前端资源..."
	@rm -rf tools/admin-server/web/dist
	@mkdir -p tools/admin-server/web
	@cp -r admin-frontend/dist tools/admin-server/web/
	@echo "✅ 前端资源已嵌入"

# 编译后端（包含嵌入前端）
admin-build-backend: admin-embed
	@echo "🔨 编译后端..."
	@cd tools/admin-server && go build -o ../../bin/linux/admin-server ./cmd/admin-server
	@echo "✅ 后端编译完成: bin/linux/admin-server"

# 完整发布构建
admin-release: admin-build-backend
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "✅ Admin 发布完成!"
	@echo ""
	@echo "运行: bin/linux/admin-server --port 8888"
	@echo "访问: http://localhost:8888/admin/"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 清理 Admin 构建产物
clean-admin:
	@echo "🧹 清理 Admin 构建产物..."
	@rm -rf admin-frontend/dist
	@rm -rf admin-frontend/node_modules
	@rm -rf tools/admin-server/web/dist
	@rm -f bin/linux/admin-server
	@echo "✅ 清理完成"
