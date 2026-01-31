// 🚀 纯文本URL自动转换为可点击链接功能
(function() {
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    // 🔍 正则表达式：匹配URL（支持http、https、ftp等）
    const urlRegex = /(https?:\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?)/g;
    
    // 📋 获取所有文章内容区域
    const contentElements = document.querySelectorAll('.post-content, .VPDoc');
    
    contentElements.forEach(contentElement => {
      // 🔄 遍历所有文本节点
      const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      
      let node;
      while (node = walker.nextNode()) {
        // 🚫 跳过已经是链接子节点的文本
        if (node.parentNode.tagName !== 'A') {
          textNodes.push(node);
        }
      }
      
      // 🔗 处理每个文本节点
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        let lastIndex = 0;
        let newContent = '';
        let match;
        
        // 🎯 查找所有URL匹配项
        while ((match = urlRegex.exec(text)) !== null) {
          const url = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + url.length;
          
          // 添加URL之前的文本
          newContent += text.substring(lastIndex, startIndex);
          
          // 📦 创建链接元素
          const linkElement = document.createElement('a');
          linkElement.href = url;
          linkElement.target = '_blank';
          linkElement.rel = 'noopener noreferrer';
          
          // 🎨 添加自定义类名
          linkElement.className = 'shiroki-auto-link';
          
          // 🔍 使用完整URL作为链接文本
          linkElement.textContent = url;
          
          // 📌 替换文本节点为包含链接的元素
          const tempElement = document.createElement('div');
          tempElement.innerHTML = newContent + linkElement.outerHTML;
          newContent = tempElement.innerHTML;
          
          lastIndex = endIndex;
        }
        
        // 添加剩余文本
        newContent += text.substring(lastIndex);
        
        // 🚀 更新DOM内容
        if (newContent !== text) {
          const tempElement = document.createElement('div');
          tempElement.innerHTML = newContent;
          
          // 替换原始文本节点
          while (tempElement.firstChild) {
            textNode.parentNode.insertBefore(tempElement.firstChild, textNode);
          }
          textNode.parentNode.removeChild(textNode);
        }
      });
    });
  });
  
  // 📌 提取域名的辅助函数
  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, ''); // 移除www前缀
    } catch (e) {
      return url; // 如果解析失败，返回原始URL
    }
  }
})();
