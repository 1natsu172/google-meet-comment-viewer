import React, { Fragment, useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { browser, Runtime } from 'webextension-polyfill-ts'

type Comment = {
  senderName: string
  formattedTimestamp: string
  comment: string
}

function App() {
  const [comments, setComments] = useState<Comment[]>([])

  const messageHandler = useCallback(
    (message, sender: Runtime.MessageSender) => {
      console.log('sender', sender)
      if (message.fromMeet) {
        setComments((prev) => [...prev, message.fromMeet])
      }
      return Promise.resolve()
    },
    [],
  )
  useEffect(() => {
    browser.runtime.onMessage.addListener(messageHandler)
    return () => {
      browser.runtime.onMessage.removeListener(messageHandler)
    }
  }, [])
  return (
    <div>
      <h1>Options</h1>
      <button id="test">TEST!</button>
      {comments.map((comment, index) => (
        <Fragment key={index}>
          <div>{comment.senderName}</div>
          <div>{comment.comment}</div>
          <div>{comment.formattedTimestamp}</div>
        </Fragment>
      ))}
    </div>
  )
}

const mountNode = document.getElementById('app')
ReactDOM.render(<App />, mountNode)

let popupLaunchedTabId: number

console.log('popup launched')
document.addEventListener('DOMContentLoaded', () => {
  console.log('domcon')

  browser.runtime.onConnect.addListener(function (port) {
    console.assert(port.name == 'knockknock')
    port.onMessage.addListener(function (msg) {
      if (msg.joke == 'Knock knock')
        port.postMessage({ question: "Who's there?" })
      else if (msg.answer == 'Madame')
        port.postMessage({ question: 'Madame who?' })
      else if (msg.answer == 'Madame... Bovary')
        port.postMessage({ question: "I don't get it." })
    })
  })

  browser.runtime
    .sendMessage({ fromPopup: 'launched' })
    .then(({ tabId }) => {
      console.log('tabid is ', tabId)
      popupLaunchedTabId = tabId
    })
    .then(() => {
      browser.tabs.sendMessage(popupLaunchedTabId, {
        tabId: popupLaunchedTabId,
        fromPopup: 'launched',
      })
    })
})

// document.getElementById('test').addEventListener('click', () => {
//   console.log('Popup DOM fully loaded and parsed')

//   function modifyDOM() {
//     //You can play with your DOM here or check URL against your regex
//     console.log('Tab script:')
//     console.log(document.body)
//     return document.querySelector('body')
//   }
//   //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
//   // browser.scripting.executeScript(
//   //   popupLaunchedTabId,
//   //   {
//   //     // code: '(' + modifyDOM + ')();', //argument here is a string but function.toString() returns function's code
//   //     function: foo,
//   //   },
//   //   // (results) => {
//   //   //   //Here we have just the innerHTML and not DOM structure
//   //   //   console.log('Popup script:')
//   //   //   console.log(results[0])
//   //   // },
//   // )
//   function showAlert() {
//     console.log('nyan')

//     alert('test!')
//   }

//   chrome.scripting.executeScript(
//     {
//       target: { tabId: popupLaunchedTabId },
//       function: modifyDOM,
//     },
//     (results) => {
//       //Here we have just the innerHTML and not DOM structure
//       console.log('Popup script:')
//       console.log(JSON.stringify(results[0]))
//     },
//   )
// })
