import waitElement from '@1natsu/wait-element'
import debounce from 'lodash.debounce'

async function waitSideBar() {
  return await waitElement('*[jsname="xySENc"]') // 今のビルドだとコメント欄の親Nodeのアトリビュートにこれが生えてる
}

const observeConfig: MutationObserverInit = {
  attributes: true, // check only attributes
  attributeFilter: ['data-message-text'], // コメントのnodeには data-message-text が付いてるのでそれだけ監視
  childList: true, // 子見る
  subtree: true,// 孫も見る
}

/**
 * 孫nodeでなんか起こったところまではわかるが、どのnodeでなんの処理が起こったのかまではわからないので、富豪的になんか起こったら毎回親nodeから全コメントパースして全コメントの配列を送ることにしている
 */
const mutationCallback = (
  commentParentNode: Node,
  onObserveHandler: (...args: unknown[]) => unknown,
): MutationCallback => mutations => {
  mutations.forEach(debounce(mutation => {
    // console.log(mutation);

    /**
     * コメント欄の親node
     */
    const targetClassList = commentParentNode as HTMLElement

    /**
     * 時系列順に並んだコメント発言者別のコメントのnodes
     */
    const childNodes = [...targetClassList.childNodes]
    if (!childNodes.length) {
      return
    }

    /**
     * Node掘って欲しい情報パースする
     */
    const comments = childNodes.map(node => {
      const { senderName } = (node as HTMLElement).dataset
      const { formattedTimestamp } = (node as HTMLElement).dataset
      // 同一時刻(1分内)の発言は1つのnodeに押し込められているので、各発言ごとに配列でパースする
      const commentTextNodes = [...(node as HTMLElement).childNodes[1]?.childNodes]
      const comment = commentTextNodes.map(node => node.textContent).filter((text): text is string => typeof text === 'string')

      return {
        formattedTimestamp,
        senderName,
        comment
      }
    })

    /**
     * 全コメントをまるごと渡す
     */
    if (comments.length) {
      onObserveHandler(comments)
    }
  }, 500, {
    leading: false,
    trailing: true,
    maxWait: 2000
  }))
}


export async function observeComment(onObserveHandler: (...args: unknown[]) => unknown) {
  /**
   * サイドバーが出てないとコメントのDOMがないのでまず待つ。サイドバーが出てさえすれば、コメントの親Nodeがある
   */
  const target = await waitSideBar() as Node
  console.log(target, 'target ready');

  const observer = new MutationObserver(mutationCallback(target, onObserveHandler))
  observer.observe(target, observeConfig)
  return observer
}