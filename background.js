chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("hello " + request);
  
  if (request.action === 'newTab') {
    chrome.tabs.create({});
  } else if (request.action === 'newWindow') {
    chrome.windows.create({});
  } else if (request.action === 'openHistory') {
    chrome.tabs.create({ url: "chrome://history" });
  }
  // Add more cases for other actions
  sendResponse({ success: true });
});
