//讓popup 自動讀取版本
const versionElement = document.getElementById('extension-version');

if (versionElement) {
  versionElement.textContent = chrome.runtime.getManifest().version;
}

// 點擊「Customize Shortcuts」按鈕時打開設置頁面
document.getElementById('shortcuts-btn').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});