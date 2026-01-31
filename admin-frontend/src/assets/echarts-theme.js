/**
 * Hugo Teek Admin - ECharts Theme (Fresh & Simple)
 * Based on Sky Blue + Mint Green Color Palette
 */

export const hugoTeekTheme = {
  // 配色方案 (清新柔和)
  color: [
    '#60A5FA', // primary - 浅蓝
    '#34D399', // accent - 薄荷绿
    '#A78BFA', // 浅紫
    '#FBBF24', // 浅黄
    '#F87171', // 浅红
    '#93C5FD', // 更浅蓝
    '#6EE7B7', // 更浅绿
    '#F9A8D4', // 浅粉
    '#34D399', // 重复薄荷绿
    '#F87171', // 重复浅红
  ],

  // 背景色
  backgroundColor: 'transparent',

  // 全局文本样式 (柔和灰色)
  textStyle: {
    fontFamily: 'Fira Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
    color: '#374151', // text-primary (gray-700)
  },

  // 标题样式
  title: {
    textStyle: {
      color: '#374151', // gray-700
      fontSize: 18,
      fontWeight: 600,
    },
    subtextStyle: {
      color: '#9CA3AF', // text-muted (gray-400)
      fontSize: 14,
    },
  },

  // 折线图
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 3,
    },
    itemStyle: {
      borderWidth: 2,
      borderColor: '#fff',
    },
    emphasis: {
      scale: true,
      scaleSize: 10,
    },
  },

  // 柱状图
  bar: {
    barMaxWidth: 40,
    itemStyle: {
      borderRadius: [8, 8, 0, 0],
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // 饼图
  pie: {
    radius: ['40%', '70%'], // 环形图
    itemStyle: {
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 2,
    },
    label: {
      color: '#374151', // gray-700
      fontSize: 12,
      fontWeight: 500,
    },
    labelLine: {
      lineStyle: {
        color: '#D1D5DB', // border-default (gray-300)
      },
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowColor: 'rgba(96, 165, 250, 0.15)', // Sky Blue
      },
      label: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
  },

  // 散点图
  scatter: {
    symbol: 'circle',
    symbolSize: 10,
    itemStyle: {
      borderWidth: 2,
      borderColor: '#fff',
      opacity: 0.8,
    },
    emphasis: {
      scale: true,
      scaleSize: 14,
      itemStyle: {
        opacity: 1,
      },
    },
  },

  // 雷达图
  radar: {
    axisLine: {
      lineStyle: {
        color: '#D1D5DB', // gray-300
      },
    },
    splitLine: {
      lineStyle: {
        color: '#E5E7EB', // gray-200
      },
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(255,255,255,0)', 'rgba(245,245,245,0.5)'], // gray-100
      },
    },
    axisLabel: {
      color: '#9CA3AF', // gray-400
      fontSize: 12,
    },
  },

  // 地图
  map: {
    itemStyle: {
      areaColor: '#F5F5F5', // gray-100
      borderColor: '#D1D5DB', // gray-300
      borderWidth: 1,
    },
    label: {
      color: '#374151', // gray-700
      fontSize: 12,
    },
    emphasis: {
      itemStyle: {
        areaColor: '#60A5FA', // Sky Blue
        borderColor: '#3B82F6', // primary-dark
      },
      label: {
        color: '#FFFFFF',
      },
    },
  },

  // 坐标轴
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#E5E7EB', // gray-200
        width: 1,
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#9CA3AF', // gray-400
      fontSize: 12,
      margin: 12,
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: '#F5F5F5', // gray-100
      },
    },
  },

  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#9CA3AF', // gray-400
      fontSize: 12,
      margin: 12,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#F5F5F5', // gray-100
        type: 'dashed',
      },
    },
  },

  // 时间轴
  timeAxis: {
    axisLine: {
      lineStyle: {
        color: '#E5E7EB', // gray-200
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#9CA3AF', // gray-400
      fontSize: 12,
    },
    splitLine: {
      show: false,
    },
  },

  // 工具箱
  toolbox: {
    iconStyle: {
      borderColor: '#9CA3AF', // gray-400
    },
    emphasis: {
      iconStyle: {
        borderColor: '#60A5FA', // Sky Blue
      },
    },
  },

  // 图例
  legend: {
    textStyle: {
      color: '#374151', // gray-700
      fontSize: 14,
    },
    itemWidth: 14,
    itemHeight: 14,
    itemGap: 16,
    icon: 'roundRect',
  },

  // 提示框
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#E5E7EB', // gray-200
    borderWidth: 1,
    textStyle: {
      color: '#374151', // gray-700
      fontSize: 13,
    },
    extraCssText: 'border-radius: 8px; box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.08); padding: 12px;',
  },

  // 时间轴组件
  timeline: {
    lineStyle: {
      color: '#D1D5DB', // gray-300
      width: 2,
    },
    itemStyle: {
      color: '#D1D5DB', // gray-300
      borderWidth: 1,
    },
    controlStyle: {
      color: '#60A5FA', // Sky Blue
      borderColor: '#60A5FA',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: '#60A5FA', // Sky Blue
      borderColor: '#FFFFFF',
    },
    label: {
      color: '#9CA3AF', // gray-400
    },
    emphasis: {
      itemStyle: {
        color: '#60A5FA', // Sky Blue
      },
      controlStyle: {
        color: '#60A5FA',
        borderColor: '#60A5FA',
      },
      label: {
        color: '#374151', // gray-700
      },
    },
  },

  // 视觉映射组件
  visualMap: {
    textStyle: {
      color: '#374151', // gray-700
      fontSize: 12,
    },
    inRange: {
      color: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA'],
    },
  },

  // 数据区域缩放组件
  dataZoom: {
    backgroundColor: 'rgba(245, 245, 245, 0.5)', // gray-100
    dataBackgroundColor: 'rgba(209, 213, 219, 0.3)', // gray-300
    fillerColor: 'rgba(96, 165, 250, 0.15)', // Sky Blue
    handleColor: '#60A5FA', // Sky Blue
    handleSize: '100%',
    textStyle: {
      color: '#9CA3AF', // gray-400
    },
  },

  // Markdown 组件
  markPoint: {
    label: {
      color: '#FFFFFF',
    },
    emphasis: {
      label: {
        color: '#FFFFFF',
      },
    },
  },
};

// 注册主题的辅助函数
export function registerHugoTeekTheme(echarts) {
  if (echarts && echarts.registerTheme) {
    echarts.registerTheme('hugo-teek', hugoTeekTheme);
  }
}

export default hugoTeekTheme;
