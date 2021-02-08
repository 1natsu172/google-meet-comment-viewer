import waitElement from '@1natsu/wait-element'

async function waitSideBar() {
  return await waitElement('*[jsname="xySENc"]')
}

const observeConfig: MutationObserverInit = {
  // attributes: true, // check only attributes
  // attributeFilter: ['class', 'data-message-text'], // check only className attribute
  // subtree: true,// observe child and grandson
  childList: true,
  // characterData: true
}

const mutationCallback: MutationCallback = mutations => {
  mutations.forEach(mutation => {
    // console.log(mutation);

    /**
     * コメントの親node
     */
    const targetClassList = (mutation.target as HTMLElement)
    /**
     * 各コメントのnodes
     */
    const childNodes = [...targetClassList.children]
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
  })
}


export async function observeComment() {
  const target = await waitSideBar() as Node
  console.log(target, 'target ready');

  return new MutationObserver(mutationCallback).observe(target, observeConfig)
}