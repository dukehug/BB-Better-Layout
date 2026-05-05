// 點擊「Customize Shortcuts」按鈕時打開設置頁面
document.getElementById('shortcuts-btn').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});