import { browser } from "webextension-polyfill-ts"
import { observeComment } from './observeComment'

console.log('content script', browser);



/**
 * 
 */
browser.runtime.onMessage.addListener((message, sender) => {
  console.log('meetcon', message);
  if (message.fromPopup === 'launched') {
    console.log('whoaa,');
    var port = browser.runtime.connect();
    port.postMessage({ joke: "Knock knock" });
    port.onMessage.addListener(function (msg) {
      if (msg.question == "Who's there?")
        port.postMessage({ answer: "Madame" });
      else if (msg.question == "Madame who?")
        port.postMessage({ answer: "Madame... Bovary" });
    });

    return Promise.resolve().then(observeComment)
  }
})
