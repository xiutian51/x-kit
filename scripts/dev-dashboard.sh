#!/bin/bash

# Dashboard 本地开发脚本
# 用法: ./scripts/dev-dashboard.sh [enhanced|basic]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# 检查参数
MODE=${1:-enhanced}

if [ "$MODE" = "enhanced" ]; then
  echo "🚀 生成增强版 Dashboard..."
  bun run scripts/generate-dashboard-enhanced.ts
elif [ "$MODE" = "basic" ]; then
  echo "🚀 生成基础版 Dashboard..."
  bun run scripts/generate-dashboard.ts
else
  echo "❌ 未知模式: $MODE"
  echo "用法: $0 [enhanced|basic]"
  exit 1
fi

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Dashboard 已生成: dashboard/index.html"
  echo ""
  echo "📋 预览方式："
  echo "   1. 使用 Python: cd dashboard && python3 -m http.server 8000"
  echo "   2. 使用 VS Code Live Server 扩展"
  echo "   3. 直接在浏览器打开: open dashboard/index.html"
  echo ""
  echo "🌐 访问地址: http://localhost:8000"
else
  echo "❌ 生成失败，请检查错误信息"
  exit 1
fi

