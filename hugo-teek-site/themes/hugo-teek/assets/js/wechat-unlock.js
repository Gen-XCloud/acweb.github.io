// ======================================================
// 公众号引流解锁功能 (WeChat Unlock Feature)
// ======================================================
// 功能: 文章内容解锁，引流微信公众号
// 安全措施: 限制验证次数、验证延迟、本地存储防篡改、AES-256-GCM加密
// ======================================================

(function() {
  'use strict';

  // ============ 配置读取 ============
  const CONFIG = {
    SALT: window.siteConfig?.wechatUnlock?.salt || 'default-salt-2025',
    MAX_ATTEMPTS: window.siteConfig?.wechatUnlock?.maxAttempts || 5,
    LOCK_TIME: (window.siteConfig?.wechatUnlock?.lockTime || 3600) * 1000, // 转为毫秒
    VERIFY_DELAY: window.siteConfig?.wechatUnlock?.verifyDelay || 500
  };

  // ============ 加密/解密功能 ============

  /**
   * 使用Web Crypto API解密内容
   * @param {string} encryptedBase64 - Base64编码的加密数据
   * @param {string} unlockCode - 解锁码
   * @param {string} salt - 盐值
   * @returns {Promise<string>} - 解密后的HTML
   */
  async function decryptContent(encryptedBase64, unlockCode, salt) {
    try {
      // 1. 导入密钥材料
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(unlockCode),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // 2. 派生AES密钥 (与Go代码保持一致: PBKDF2-SHA256, 10000轮)
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: 10000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // 3. Base64解码
      const encryptedData = atob(encryptedBase64);
      const encryptedBytes = new Uint8Array(encryptedData.length);
      for (let i = 0; i < encryptedData.length; i++) {
        encryptedBytes[i] = encryptedData.charCodeAt(i);
      }

      // 4. 提取nonce(前12字节)和ciphertext
      const nonce = encryptedBytes.slice(0, 12);
      const ciphertext = encryptedBytes.slice(12);

      // 5. 解密
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        key,
        ciphertext
      );

      // 6. 转换为字符串
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      console.error('[WechatUnlock] 解密失败:', e);
      throw new Error('解密失败，解锁码可能不正确');
    }
  }

  // ============ 解锁码生成与验证 ============

  /**
   * 使用SubtleCrypto生成解锁码（SHA-256）
   * @param {string} permalink - 文章URL
   * @returns {Promise<string>} - 6位解锁码
   */
  async function generateUnlockCode(permalink) {
    const text = permalink + CONFIG.SALT;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 6).toUpperCase();
  }

  /**
   * 生成手动解锁码的哈希值（与Hugo模板保持一致）
   * @param {string} code - 原始解锁码
   * @returns {Promise<string>} - 6位哈希值
   */
  async function generateManualCodeHash(code) {
    const text = code + CONFIG.SALT;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 6).toUpperCase();
  }

  /**
   * 验证解锁码
   * @param {string} permalink - 文章URL
   * @param {string} inputCode - 用户输入的解锁码
   * @param {string} codeHash - 手动指定解锁码的哈希值（可选）
   * @returns {Promise<boolean>} - 是否正确
   */
  async function verifyUnlockCode(permalink, inputCode, codeHash = null) {
    // 添加延迟防止暴力破解
    await new Promise(resolve => setTimeout(resolve, CONFIG.VERIFY_DELAY));

    // 如果指定了手动解锁码的哈希值，对用户输入进行哈希后比对
    if (codeHash) {
      const inputHash = await generateManualCodeHash(inputCode);
      return inputHash === codeHash;
    }

    // 否则使用自动生成的解锁码
    const correctCode = await generateUnlockCode(permalink);
    return inputCode.toUpperCase() === correctCode;
  }

  // ============ 本地存储管理 ============

  /**
   * 规范化URL（去掉末尾斜杠，统一比对）
   * @param {string} url - 原始URL
   * @returns {string} - 规范化后的URL
   */
  function normalizeUrl(url) {
    return url.replace(/\/$/, '').toLowerCase();
  }

  /**
   * 获取已解锁文章列表
   * @returns {Array} - 已解锁文章列表
   */
  function getUnlockedArticles() {
    try {
      const data = localStorage.getItem('unlockedArticles');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[WechatUnlock] 读取存储失败:', e);
      return [];
    }
  }

  /**
   * 检查文章是否已解锁（带验证）
   * @param {string} permalink - 文章URL
   * @param {string} codeHash - 手动指定解锁码的哈希值（可选）
   * @returns {Promise<boolean>} - 是否已解锁
   */
  async function isArticleUnlocked(permalink, codeHash = null) {
    const articles = getUnlockedArticles();
    const normalizedPermalink = normalizeUrl(permalink);
    const record = articles.find(a => normalizeUrl(a.permalink) === normalizedPermalink);

    if (!record) return false;

    // 验证存储的解锁码是否正确（防止篡改）
    const isValid = await verifyUnlockCode(permalink, record.unlockCode, codeHash);
    if (!isValid) {
      removeUnlockedArticle(permalink);
      return false;
    }

    return true;
  }

  /**
   * 标记文章为已解锁
   * @param {string} permalink - 文章URL
   * @param {string} unlockCode - 解锁码
   */
  function markAsUnlocked(permalink, unlockCode) {
    try {
      const articles = getUnlockedArticles();
      const normalizedPermalink = normalizeUrl(permalink);
      // 去重（使用规范化URL比对）
      const filtered = articles.filter(a => normalizeUrl(a.permalink) !== normalizedPermalink);
      filtered.push({
        permalink: normalizedPermalink, // 保存规范化的URL
        unlockCode,
        unlockedAt: new Date().toISOString()
      });
      localStorage.setItem('unlockedArticles', JSON.stringify(filtered));
      console.log('[WechatUnlock] 已保存解锁状态:', normalizedPermalink);
    } catch (e) {
      console.error('[WechatUnlock] 保存失败:', e);
    }
  }

  /**
   * 移除已解锁记录
   * @param {string} permalink - 文章URL
   */
  function removeUnlockedArticle(permalink) {
    try {
      const articles = getUnlockedArticles();
      const normalizedPermalink = normalizeUrl(permalink);
      const filtered = articles.filter(a => normalizeUrl(a.permalink) !== normalizedPermalink);
      localStorage.setItem('unlockedArticles', JSON.stringify(filtered));
    } catch (e) {
      console.error('[WechatUnlock] 移除失败:', e);
    }
  }

  // ============ 验证次数限制 ============

  /**
   * 检查验证次数限制
   * @param {string} permalink - 文章URL
   * @returns {Object} - {allowed: boolean, reason: string, remainingAttempts: number}
   */
  function checkRateLimit(permalink) {
    const key = `unlock_attempts_${permalink}`;
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');

      // 检查是否已锁定
      if (data.lockedUntil && Date.now() < data.lockedUntil) {
        const remainingTime = Math.ceil((data.lockedUntil - Date.now()) / 1000 / 60);
        return {
          allowed: false,
          reason: `尝试次数过多，请 ${remainingTime} 分钟后再试`,
          remainingAttempts: 0
        };
      }

      // 重置过期的锁定
      if (data.lockedUntil && Date.now() >= data.lockedUntil) {
        data.attempts = 0;
        data.lockedUntil = null;
      }

      const attempts = data.attempts || 0;
      const remainingAttempts = CONFIG.MAX_ATTEMPTS - attempts;

      if (attempts >= CONFIG.MAX_ATTEMPTS) {
        data.lockedUntil = Date.now() + CONFIG.LOCK_TIME;
        localStorage.setItem(key, JSON.stringify(data));
        return {
          allowed: false,
          reason: `尝试次数已达上限，已锁定 ${CONFIG.LOCK_TIME / 1000 / 60} 分钟`,
          remainingAttempts: 0
        };
      }

      return { allowed: true, reason: '', remainingAttempts };
    } catch (e) {
      console.error('[WechatUnlock] 检查限制失败:', e);
      return { allowed: true, reason: '', remainingAttempts: CONFIG.MAX_ATTEMPTS };
    }
  }

  /**
   * 记录验证尝试
   * @param {string} permalink - 文章URL
   */
  function recordAttempt(permalink) {
    const key = `unlock_attempts_${permalink}`;
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      data.attempts = (data.attempts || 0) + 1;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('[WechatUnlock] 记录尝试失败:', e);
    }
  }

  /**
   * 重置验证次数
   * @param {string} permalink - 文章URL
   */
  function resetAttempts(permalink) {
    const key = `unlock_attempts_${permalink}`;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[WechatUnlock] 重置失败:', e);
    }
  }

  // ============ 内容加载 ============

  /**
   * 从服务器加载完整内容
   * @param {string} contentUrl - content.json的URL
   * @returns {Promise<Object>} - 内容对象
   */
  async function loadFullContent(contentUrl) {
    try {
      const response = await fetch(contentUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (e) {
      console.error('[WechatUnlock] 加载内容失败:', e);
      throw new Error('无法加载完整内容，请稍后重试');
    }
  }

  // ============ UI 控制 ============

  /**
   * 创建解锁弹窗（简洁版）
   * @param {HTMLElement} gateElement - 解锁门元素
   * @returns {HTMLElement} - 弹窗元素
   */
  function createUnlockModal(gateElement) {
    const keyword = gateElement.dataset.keyword;
    const qrcode = gateElement.dataset.qrcode;
    const permalink = gateElement.dataset.permalink;
    const codeHash = gateElement.dataset.codeHash || null; // 获取手动指定解锁码的哈希值

    // 获取公众号名称（从配置或默认值）
    const accountName = window.siteConfig?.wechatUnlock?.accountName || '公众号';

    const modal = document.createElement('div');
    modal.className = 'wechat-unlock-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <button class="modal-close" type="button" aria-label="关闭">×</button>

        <h2 class="modal-title">扫码关注公众号：${accountName}</h2>

        <p class="modal-subtitle">发送：<span class="keyword">${keyword}</span></p>

        <p class="modal-description">即可<strong>立即永久</strong>解锁本站全部文章</p>

        <div class="qrcode-container">
          <img src="${qrcode}" alt="公众号二维码" class="qrcode-image">
        </div>

        <div class="code-input-container">
          <input type="text"
                 class="unlock-code-input"
                 placeholder="请输入验证码"
                 maxlength="6"
                 autocomplete="off">
        </div>

        <div class="error-message"></div>
        <div class="remaining-attempts"></div>

        <button type="button" class="unlock-submit-btn">提交</button>
      </div>
    `;

    // 绑定事件
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const submitBtn = modal.querySelector('.unlock-submit-btn');
    const input = modal.querySelector('.unlock-code-input');
    const errorMsg = modal.querySelector('.error-message');
    const attemptsMsg = modal.querySelector('.remaining-attempts');

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // 回车提交
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });

    // 提交解锁码
    submitBtn.addEventListener('click', async () => {
      const code = input.value.trim();
      errorMsg.textContent = '';
      errorMsg.style.display = 'none';

      if (!code) {
        errorMsg.textContent = '请输入解锁码';
        errorMsg.style.display = 'block';
        return;
      }

      // 检查次数限制
      const rateLimit = checkRateLimit(permalink);
      if (!rateLimit.allowed) {
        errorMsg.textContent = rateLimit.reason;
        errorMsg.style.display = 'block';
        return;
      }

      // 显示剩余次数
      if (rateLimit.remainingAttempts > 0 && rateLimit.remainingAttempts <= 3) {
        attemptsMsg.textContent = `剩余尝试次数: ${rateLimit.remainingAttempts}`;
        attemptsMsg.style.display = 'block';
      }

      // 禁用按钮
      submitBtn.disabled = true;
      submitBtn.textContent = '验证中...';

      try {
        const isValid = await verifyUnlockCode(permalink, code, codeHash);

        if (isValid) {
          // 验证成功
          markAsUnlocked(permalink, code.toUpperCase());
          resetAttempts(permalink);
          closeModal();

          // 加载完整内容
          const contentUrl = gateElement.dataset.contentUrl;
          await unlockContent(gateElement, contentUrl);
        } else {
          // 验证失败
          recordAttempt(permalink);
          const newLimit = checkRateLimit(permalink);

          if (!newLimit.allowed) {
            errorMsg.textContent = newLimit.reason;
          } else {
            errorMsg.textContent = `解锁码错误，剩余尝试次数: ${newLimit.remainingAttempts}`;
          }
          errorMsg.style.display = 'block';

          if (newLimit.remainingAttempts > 0) {
            attemptsMsg.textContent = `剩余尝试次数: ${newLimit.remainingAttempts}`;
            attemptsMsg.style.display = 'block';
          }

          input.value = '';
          input.focus();
        }
      } catch (e) {
        errorMsg.textContent = '验证失败，请稍后重试';
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '解锁';
      }
    });

    return modal;
  }

  /**
   * 解锁内容（从服务器异步加载并解密）
   * @param {HTMLElement} gateElement - 解锁门元素
   * @param {string} contentUrl - 内容URL
   */
  async function unlockContent(gateElement, contentUrl) {
    try {
      console.log('[WechatUnlock] 开始加载完整内容...');

      // 从服务器加载加密JSON
      const data = await loadFullContent(contentUrl);

      if (!data || !data.encrypted) {
        // 兼容旧版本明文格式
        if (data && data.content) {
          console.warn('[WechatUnlock] 检测到明文格式内容，直接渲染');
          renderUnlockedContent(gateElement, data.content);
          return;
        }
        throw new Error('加载的内容为空或格式错误');
      }

      // 获取当前文章的解锁码(从localStorage)
      const permalink = gateElement.dataset.permalink;
      const articles = getUnlockedArticles();
      const record = articles.find(a => normalizeUrl(a.permalink) === normalizeUrl(permalink));

      if (!record) {
        throw new Error('未找到解锁记录');
      }

      const unlockCode = record.unlockCode;

      // 解密内容
      console.log('[WechatUnlock] 开始解密内容...');
      const htmlContent = await decryptContent(data.encrypted, unlockCode, CONFIG.SALT);

      // 渲染解密后的内容
      renderUnlockedContent(gateElement, htmlContent);

      console.log('[WechatUnlock] 内容解密并加载完成');
    } catch (e) {
      console.error('[WechatUnlock] 解锁失败:', e);
      // 显示错误提示
      const errorDiv = document.createElement('div');
      errorDiv.className = 'unlock-error';
      errorDiv.innerHTML = `
        <p>内容加载失败: ${e.message}</p>
        <button onclick="location.reload()">刷新页面</button>
      `;
      gateElement.parentNode.insertBefore(errorDiv, gateElement.nextSibling);
    }
  }

  /**
   * 渲染解锁后的HTML内容
   * @param {HTMLElement} gateElement - 解锁门元素
   * @param {string} htmlContent - HTML内容
   */
  function renderUnlockedContent(gateElement, htmlContent) {
    // 创建临时容器解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // 找到解锁门元素
    const tempGate = tempDiv.querySelector('.wechat-unlock-gate');
    if (!tempGate) {
      console.warn('[WechatUnlock] 未找到解锁门标记，加载全部内容');
      // 如果没有找到解锁门，说明内容格式异常，直接插入所有内容
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      gateElement.parentNode.insertBefore(fragment, gateElement.nextSibling);
    } else {
      // 获取解锁门之后的所有内容
      const fragment = document.createDocumentFragment();
      let next = tempGate.nextElementSibling;
      while (next) {
        const node = next;
        next = next.nextElementSibling;
        fragment.appendChild(node);
      }

      // 插入到实际页面的解锁门后面
      gateElement.parentNode.insertBefore(fragment, gateElement.nextSibling);
    }

    // 添加已解锁标记（隐藏解锁门）
    document.documentElement.classList.add('wechat-unlocked');
  }

  // ============ 初始化 ============

  /**
   * 初始化解锁功能
   */
  async function initWechatUnlock() {
    const gates = document.querySelectorAll('.wechat-unlock-gate');
    if (gates.length === 0) return;

    // 如果页面已解锁（从localStorage恢复），自动加载内容
    if (document.documentElement.classList.contains('wechat-unlocked')) {
      console.log('[WechatUnlock] 页面已解锁，自动加载内容...');

      // 为每个解锁门加载内容
      for (const gate of gates) {
        const contentUrl = gate.dataset.contentUrl;
        if (contentUrl) {
          try {
            await unlockContent(gate, contentUrl);
          } catch (e) {
            console.error('[WechatUnlock] 自动加载失败:', e);
            // 如果自动加载失败，移除解锁标记，让用户重新解锁
            document.documentElement.classList.remove('wechat-unlocked');
            const permalink = gate.dataset.permalink;
            removeUnlockedArticle(permalink);
          }
        }
      }
      return;
    }

    // 未解锁：绑定解锁按钮
    for (const gate of gates) {
      const unlockBtn = gate.querySelector('.unlock-button-simple');
      if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
          const modal = createUnlockModal(gate);
          document.body.appendChild(modal);
          document.body.style.overflow = 'hidden';

          // 聚焦输入框
          setTimeout(() => {
            const input = modal.querySelector('.unlock-code-input');
            if (input) input.focus();
          }, 100);
        });
      }
    }

    console.log('[WechatUnlock] 已初始化');
  }

  // 导出到全局（供Swup调用）
  window.initWechatUnlock = initWechatUnlock;

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWechatUnlock);
  } else {
    initWechatUnlock();
  }
})();
