/**
 * 简单的 TOML 解析器
 * 仅支持基本的 key = value 格式
 * 用于 Hugo Front Matter 解析
 */

const TOML = {
  /**
   * 解析 TOML 字符串为对象
   * @param {string} tomlString - TOML 格式字符串
   * @returns {object} 解析后的对象
   */
  parse: function(tomlString) {
    const result = {};
    const lines = tomlString.split('\n');

    for (const line of lines) {
      // 跳过空行和注释
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // 解析 key = value
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // 解析值类型
      if (value.startsWith('"') && value.endsWith('"')) {
        // 字符串
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        // 单引号字符串
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // 数组
        const arrayContent = value.substring(1, value.length - 1);
        value = arrayContent.split(',').map(item => {
          item = item.trim();
          if (item.startsWith('"') && item.endsWith('"')) {
            return item.substring(1, item.length - 1);
          }
          return item;
        }).filter(item => item);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(value)) {
        // 数字
        value = Number(value);
      }

      result[key] = value;
    }

    return result;
  },

  /**
   * 将对象序列化为 TOML 字符串
   * @param {object} obj - 要序列化的对象
   * @returns {string} TOML 格式字符串
   */
  stringify: function(obj) {
    const lines = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      let serialized;
      if (typeof value === 'string') {
        // 转义引号
        const escaped = value.replace(/"/g, '\\"');
        serialized = `"${escaped}"`;
      } else if (Array.isArray(value)) {
        // 数组
        const items = value.map(item => {
          if (typeof item === 'string') {
            return `"${item.replace(/"/g, '\\"')}"`;
          }
          return String(item);
        });
        serialized = `[${items.join(', ')}]`;
      } else if (typeof value === 'boolean') {
        serialized = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        serialized = String(value);
      } else if (value instanceof Date) {
        serialized = value.toISOString();
      } else {
        // 对象类型，简单转为字符串
        serialized = `"${JSON.stringify(value)}"`;
      }

      lines.push(`${key} = ${serialized}`);
    }

    return lines.join('\n');
  }
};

// 兼容模块导出和全局变量
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOML;
} else if (typeof window !== 'undefined') {
  window.TOML = TOML;
}
