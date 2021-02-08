import waitElement from '@1natsu/wait-element'

async function waitSideBar() {
  return await waitElement('*[jsname="xySENc"]')
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
  mutations.forEach(mutation => {
    // console.log(mutation);

    /**
     * コメントの親node
     */
    const targetClassList = commentParentNode as HTMLElement

    /**
     * 各コメントのnodes
     */
    const childNodes = [...targetClassList.childNodes]
    if (!childNodes.length) {
      return
    }

    /**`
     * Node掘って欲しい情報パースする
     */
    const comments = childNodes.map(node => {
      const { senderName } = (node as HTMLElement).dataset
      const { formattedTimestamp } = (node as HTMLElement).dataset
      const comment = (node as HTMLElement).childNodes[1].textContent // 子エレメント掘った先のtextContentがコメント文
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
  })
}


export async function observeComment(onObserveHandler: (...args: unknown[]) => unknown) {
  /**
   * サイドバーが出てないとコメントのDOMがないのでまず待つ。サイドバーが出てさえすれば、コメントの親Nodeがある
   */
  const target = await waitSideBar() as Node
  console.log(target, 'target ready');

  return new MutationObserver(mutationCallback(target, onObserveHandler)).observe(target, observeConfig)
}