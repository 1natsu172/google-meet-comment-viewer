import { browser } from 'webextension-polyfill-ts'

browser.action.onClicked.addListener(function (tab) {
  browser.windows.create({
    url: browser.runtime.getURL("popup.html"),
    type: "popup"
  });
});

