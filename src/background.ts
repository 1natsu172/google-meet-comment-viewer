import { browser } from 'webextension-polyfill-ts'

let tabId: number

// @ts-ignore
(browser.action as typeof browser.browserAction).onClicked.addListener(async (tab) => {
  console.log('user action tabId: ', tab.id);
  if (!tab.id) {
    return
  }

  tabId = tab.id

  await browser.windows.create({
    url: browser.runtime.getURL("popup.html"),
    type: "popup",
    tabId: tab.id
  }).catch(error => {
    console.error(error);
  });
});

/**
 * 外部ウィンドウのpopupの起動を待ってから、popupにtabIdを渡す
 */
browser.runtime.onMessage.addListener((message, sender) => {
  console.log('sender', sender);

  if (message.fromPopup === 'launched') {
    return Promise.resolve({ tabId: tabId })
  }
})
