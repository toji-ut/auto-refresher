document.addEventListener('DOMContentLoaded', function() {
  const intervalInput = document.getElementById('interval');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');
  
  let currentTabId = null;
  let isRefreshing = false;
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      currentTabId = tabs[0].id;
      loadSavedInterval();
      checkRefreshStatus();
    }
  });
  
  function loadSavedInterval() {
    if (currentTabId) {
      chrome.storage.local.get([`interval_${currentTabId}`], function(result) {
        if (result[`interval_${currentTabId}`]) {
          intervalInput.value = result[`interval_${currentTabId}`];
        }
      });
    }
  }
  
  function checkRefreshStatus() {
    if (currentTabId) {
      chrome.storage.local.get([`refreshing_${currentTabId}`], function(result) {
        isRefreshing = result[`refreshing_${currentTabId}`] || false;
        updateUI();
      });
    }
  }
  
  function updateUI() {
    if (isRefreshing) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusDiv.textContent = 'Auto-refreshing...';
      statusDiv.className = 'status active';
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusDiv.textContent = 'Ready to start';
      statusDiv.className = 'status';
    }
  }
  
  startBtn.addEventListener('click', function() {
    const interval = parseInt(intervalInput.value);
    if (interval < 1 || interval > 1440) {
      alert('Please enter a valid interval between 1 and 1440 minutes');
      return;
    }
    
    if (currentTabId) {
      chrome.storage.local.set({
        [`interval_${currentTabId}`]: interval,
        [`refreshing_${currentTabId}`]: true
      });
      
      chrome.runtime.sendMessage({
        action: 'startRefresh',
        tabId: currentTabId,
        interval: interval
      });
      
      isRefreshing = true;
      updateUI();
    }
  });
  
  stopBtn.addEventListener('click', function() {
    if (currentTabId) {
      chrome.storage.local.set({
        [`refreshing_${currentTabId}`]: false
      });
      
      chrome.runtime.sendMessage({
        action: 'stopRefresh',
        tabId: currentTabId
      });
      
      isRefreshing = false;
      updateUI();
    }
  });
  
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'refreshStatusChanged') {
      isRefreshing = message.isRefreshing;
      updateUI();
    }
  });
});
