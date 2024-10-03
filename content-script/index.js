window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'FROM_APP') {
    chrome.runtime.sendMessage({ action: event.data.action }, (response) => {
      console.log('Action completed:', response.success);
    });
  }
});
