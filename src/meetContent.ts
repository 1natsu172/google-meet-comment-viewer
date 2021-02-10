import { browser, Runtime } from "webextension-polyfill-ts"
import { observeComment } from './observeComment'

console.log('content script start');

let port: Runtime.Port | undefined
let commentObserver: MutationObserver | undefined

/**
 * popupのreadyを待ってから処理実行する
 */
browser.runtime.onMessage.addListener((message, sender) => {
  console.log('content script received message', message);
  if (message.fromPopup === 'launched') {
    port = browser.runtime.connect();

    const onHandleObserve = (comments: any) => {
      port?.postMessage({ newMeetComment: comments });
    }

    return Promise.resolve().then(() => observeComment(onHandleObserve)).then((_commentObserver) => {
      commentObserver = _commentObserver
    })
  }
})


browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.fromBackground?.extensionState === 'popupWindowRemoved') {
    console.log('disconnecting...');
    commentObserver?.disconnect()
    port?.disconnect()
    return Promise.resolve()
  }
})
