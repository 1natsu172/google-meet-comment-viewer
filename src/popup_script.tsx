import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { browser, Runtime } from 'webextension-polyfill-ts'
import Linkify, { LinkifyProps } from 'linkifyjs/react'

type Comment = {
  senderName: string
  formattedTimestamp: string
  comment: string[]
}

const linkifyProps: LinkifyProps = {
  options: {
    attributes: {
      rel: 'noreferrer noopener',
    },
  },
}

function App() {
  const [comments, setComments] = useState<Comment[]>([])
  const portRef = useRef<Runtime.Port>()
  const bottomDomRef = useRef<HTMLDivElement>(null)

  const handleNewMeetComment = useCallback((message, port: Runtime.Port) => {
    // console.log('message', message, 'port', port)
    if (message.newMeetComment) {
      setComments(message.newMeetComment)
    }
    return Promise.resolve()
  }, [])
  useEffect(() => {
    const handleOnConnectPort = (port: Runtime.Port) => {
      portRef.current = port
      portRef.current.onMessage.addListener(handleNewMeetComment)
    }
    browser.runtime.onConnect.addListener(handleOnConnectPort)
    return () => {
      browser.runtime.onMessage.removeListener(handleOnConnectPort)
      portRef.current?.onMessage.removeListener(handleNewMeetComment)
    }
  }, [])

  useEffect(() => {
    // コメント更新されたらbottomにauto scrollする
    bottomDomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  return (
    <main>
      <h1>Comments</h1>
      {comments.map((comment, index) => (
        <article key={index} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', margin: '0 8px 0 0' }}>
              {comment.senderName}
            </h2>
            <time>{comment.formattedTimestamp}</time>
          </div>
          {comment.comment.map((text, index) => (
            <p key={index} style={{ fontSize: '14px' }}>
              <Linkify options={linkifyProps.options}>{text}</Linkify>
            </p>
          ))}
        </article>
      ))}
      <div ref={bottomDomRef}></div>
    </main>
  )
}

const mountNode = document.getElementById('app')
ReactDOM.render(<App />, mountNode)

let popupLaunchedTabId: number

/**
 * popupのdomContentLoadedまで完了したら、background scriptとデータのやりとりする
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('popup launched')

  /**
   * 1. まずbackgroundにpopup起きたことを伝えて、それを元にbackgroundからpopup起動時のtabIdをもらう
   * 2. もらったtabId(content script)にpopupが起きたことを伝える
   */
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
