import { browser } from "webextension-polyfill-ts"
import { observeComment } from './observeComment'

console.log('content script start');

/**
 * popupのreadyを待ってから処理実行する
 */
browser.runtime.onMessage.addListener((message, sender) => {
  console.log('content script received message', message);
  if (message.fromPopup === 'launched') {
    const port = browser.runtime.connect();

    const onHandleObserve = (comments: any) => {
      port.postMessage({ newMeetComment: comments });
    }

    return Promise.resolve().then(() => observeComment(onHandleObserve))
  }
})
