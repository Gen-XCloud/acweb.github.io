#!/bin/bash
# Lighthouse 性能测评脚本
# 使用 Docker 容器运行 Lighthouse

set -e

# 默认配置
URL="${1:-https://wiki.xxdevops.cn}"
STRATEGY="${2:-mobile}"
OUTPUT_DIR="lighthouse-reports"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
REPORT_NAME="lighthouse-$STRATEGY-$TIMESTAMP"

# 创建输出目录（绝对路径）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_PATH="$SCRIPT_DIR/$OUTPUT_DIR"
mkdir -p "$OUTPUT_PATH"
# 确保容器有写权限
chmod 777 "$OUTPUT_PATH"

echo "🚀 开始 Lighthouse 测评..."
echo "📍 目标 URL: $URL"
echo "📱 测试策略: $STRATEGY"
echo "⏳ 正在运行测试 (可能需要 30-60 秒)..."
echo ""

# 检查 Docker 是否可用
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未找到 Docker 命令"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 根据策略设置不同的参数
if [ "$STRATEGY" = "desktop" ]; then
  FORM_FACTOR="desktop"
  SCREEN_EMULATION="--preset=desktop"
else
  FORM_FACTOR="mobile"
  SCREEN_EMULATION=""
fi

# 使用 Docker 运行 Lighthouse
# 可以通过环境变量 LIGHTHOUSE_IMAGE 自定义镜像
LIGHTHOUSE_IMAGE="${LIGHTHOUSE_IMAGE:-docker.cnb.cool/yuwen-gueen/docker-images-chrom/femtopixel-google-lighthouse:latest_amd64}"

docker run --rm \
  -v "$OUTPUT_PATH:/home/chrome/reports" \
  "$LIGHTHOUSE_IMAGE" \
  "$URL" \
  --output=html \
  --output=json \
  --output-path="/home/chrome/reports/$REPORT_NAME" \
  --form-factor="$FORM_FACTOR" \
  --locale=zh-CN \
  $SCREEN_EMULATION \
  --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --ignore-certificate-errors"

echo ""
echo "============================================================"
echo "✅ 测评完成！"
echo "============================================================"
echo ""
echo "📄 报告已生成:"
echo "   HTML: $OUTPUT_DIR/$REPORT_NAME.report.html"
echo "   JSON: $OUTPUT_DIR/$REPORT_NAME.report.json"
echo ""

# 解析 JSON 报告并显示分数摘要
JSON_FILE="$OUTPUT_PATH/$REPORT_NAME.report.json"
if [ -f "$JSON_FILE" ]; then
  echo "📊 测评结果摘要:"
  echo "============================================================"

  if command -v node &> /dev/null; then
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$JSON_FILE', 'utf8'));
      const cats = data.categories;

      const getEmoji = (score) => {
        if (score >= 0.9) return '🟢';
        if (score >= 0.5) return '🟡';
        return '🔴';
      };

      const printScore = (name, cat) => {
        if (!cat) return;
        const score = Math.round(cat.score * 100);
        const emoji = getEmoji(cat.score);
        console.log(\`\${emoji} \${name.padEnd(12)}: \${score}/100\`);
      };

      printScore('性能', cats.performance);
      printScore('无障碍', cats.accessibility);
      printScore('最佳实践', cats['best-practices']);
      printScore('SEO', cats.seo);
      if (cats.pwa) printScore('PWA', cats.pwa);
    "
  elif command -v python3 &> /dev/null; then
    python3 -c "
import json
with open('$JSON_FILE', 'r') as f:
    data = json.load(f)
cats = data['categories']

def get_emoji(score):
    if score >= 0.9: return '🟢'
    if score >= 0.5: return '🟡'
    return '🔴'

def print_score(name, cat):
    if cat:
        score = round(cat['score'] * 100)
        emoji = get_emoji(cat['score'])
        print(f'{emoji} {name:<12}: {score}/100')

print_score('性能', cats.get('performance'))
print_score('无障碍', cats.get('accessibility'))
print_score('最佳实践', cats.get('best-practices'))
print_score('SEO', cats.get('seo'))
if 'pwa' in cats:
    print_score('PWA', cats['pwa'])
"
  fi
  echo "============================================================"
fi

echo ""
echo "💡 使用说明:"
echo "   make lighthouse                            # 默认测试 https://xxdevops.cn (mobile)"
echo "   make lighthouse URL=https://example.com    # 自定义 URL"
echo "   make lighthouse STRATEGY=desktop           # 桌面端测试"
echo ""
