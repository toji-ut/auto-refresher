const refreshTimers = new Map();

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'startRefresh') {
    startRefresh(message.tabId, message.interval);
  } else if (message.action === 'stopRefresh') {
    stopRefresh(message.tabId);
  }
});

function startRefresh(tabId, intervalMinutes) {
  stopRefresh(tabId);
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const timer = setInterval(() => {
    refreshTab(tabId);
  }, intervalMs);
  
  refreshTimers.set(tabId, timer);
  
  console.log(`Started auto-refresh for tab ${tabId} every ${intervalMinutes} minutes`);
}

function stopRefresh(tabId) {
  const timer = refreshTimers.get(tabId);
  if (timer) {
    clearInterval(timer);
    refreshTimers.delete(tabId);
    console.log(`Stopped auto-refresh for tab ${tabId}`);
  }
}

function refreshTab(tabId) {
  chrome.tabs.reload(tabId, function() {
    if (chrome.runtime.lastError) {
      console.error('Error refreshing tab:', chrome.runtime.lastError);
      stopRefresh(tabId);
      chrome.storage.local.set({
        [`refreshing_${tabId}`]: false
      });
    } else {
      console.log(`Refreshed tab ${tabId}`);
    }
  });
}

chrome.tabs.onRemoved.addListener(function(tabId) {
  stopRefresh(tabId);
  chrome.storage.local.remove([
    `interval_${tabId}`,
    `refreshing_${tabId}`
  ]);
});

chrome.runtime.onStartup.addListener(function() {
  refreshTimers.clear();
});

chrome.runtime.onInstalled.addListener(function() {
  refreshTimers.clear();
});
