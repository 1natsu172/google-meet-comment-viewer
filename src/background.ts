import { browser, Runtime } from 'webextension-polyfill-ts'

const tabsPort: { [toConnectTabId: string]: Runtime.Port } = {}
const tabIdMap: {
  [meetTabId: string]: {
    contentScriptTabId: number
    popupWindowTabId: number
  }
} = {}

let tempMeetTabId: number

// @ts-ignore
(browser.action as typeof browser.browserAction).onClicked.addListener(async (tab) => {
  console.log('user action tabId: ', tab.id);
  const tabId = tab.id
  if (!tabId) {
    return
  }

  tabIdMap[tabId] = { contentScriptTabId: tabId, popupWindowTabId: 0 }
  tempMeetTabId = tabId


  await browser.windows.create({
    url: browser.runtime.getURL("popup.html"),
    type: "popup",
    width: 360,
  }).then((window) => {
    // console.log('created window is ', window);
    tabIdMap[tabId] = { ...tabIdMap[tabId], popupWindowTabId: window.tabs![0].id! }
    console.log(`tabIdMap[${tab.id}]`, tabIdMap[tabId]);
  }).catch(error => {
    console.error(error);
  });


  browser.tabs.onRemoved.addListener(removedTabId => {
    const { popupWindowTabId, contentScriptTabId } = tabIdMap[tabId]
    if (popupWindowTabId === removedTabId) {
      browser.tabs.sendMessage(contentScriptTabId, {
        fromBackground: {
          extensionState: 'popupWindowRemoved'
        }
      })
      tabsPort[removedTabId]?.disconnect()
    }
  })
});

browser.runtime.onMessage.addListener((message, sender) => {
  console.log('sender', sender);

  /**
   * 外部ウィンドウのpopupの起動を待ってから、popupにpopup起動時のmeetのtabIdを渡す
   */
  if (message.fromPopup === 'launched' && message.tabIdOfPopupWindow) {
    const { tabIdOfPopupWindow } = message
    // popupとの接続を確立しておく
    const port = browser.tabs.connect(tabIdOfPopupWindow)
    // port保存しておく
    tabsPort[tabIdOfPopupWindow] = port
    return Promise.resolve({ tabId: tabIdMap[tempMeetTabId].contentScriptTabId })
  }

  /**
   * cmeetContentからコメント飛んできたら
   */
  if (message.fromMeetContent.toTabId && message.fromMeetContent.newMeetComment) {
    const { toTabId, newMeetComment } = message.fromMeetContent
    tabsPort[toTabId]?.postMessage({ newMeetComment });
  }
})
