import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { browser, Runtime } from 'webextension-polyfill-ts'

type Comment = {
  senderName: string
  formattedTimestamp: string
  comment: string
}

function App() {
  const [comments, setComments] = useState<Comment[]>([])
  const portRef = useRef<Runtime.Port>()

  const handleNewMeetComment = useCallback((message, port: Runtime.Port) => {
    console.log('message', message, 'port', port)
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
