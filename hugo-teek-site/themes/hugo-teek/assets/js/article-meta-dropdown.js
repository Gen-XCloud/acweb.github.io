// Article Meta Dropdown - 分类/标签下拉展开
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // 获取所有带下拉的元信息项
    const expandableItems = document.querySelectorAll('.tk-article-meta__item--expandable');

    expandableItems.forEach(item => {
      const moreBtn = item.querySelector('.tk-article-meta__more');
      const dropdown = item.querySelector('.tk-article-meta__dropdown');

      if (!moreBtn || !dropdown) return;

      // 点击 +N 按钮切换下拉
      moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();

        // 关闭其他已打开的下拉
        document.querySelectorAll('.tk-article-meta__dropdown.show').forEach(dd => {
          if (dd !== dropdown) {
            dd.classList.remove('show');
            dd.previousElementSibling.classList.remove('active');
          }
        });

        // 切换当前下拉
        dropdown.classList.toggle('show');
        moreBtn.classList.toggle('active');
      });

      // 阻止下拉菜单内的点击事件冒泡
      dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });

    // 点击外部区域关闭所有下拉
    document.addEventListener('click', function () {
      document.querySelectorAll('.tk-article-meta__dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
        const moreBtn = dropdown.previousElementSibling;
        if (moreBtn && moreBtn.classList.contains('tk-article-meta__more')) {
          moreBtn.classList.remove('active');
        }
      });
    });

    // ESC 键关闭下拉
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.tk-article-meta__dropdown.show').forEach(dropdown => {
          dropdown.classList.remove('show');
          const moreBtn = dropdown.previousElementSibling;
          if (moreBtn && moreBtn.classList.contains('tk-article-meta__more')) {
            moreBtn.classList.remove('active');
          }
        });
      }
    });
  });
})();
