export interface Env {
  DATA: KVNamespace
  QUEUE: Queue<{ depthToReach: number; currentDepth: number }>
}

const MESSAGES_TO_ENQUEUE = 30
const DEPTH_TO_REACH = 3

let processedMessagesCount = 0
let activeMessagesCount = 0
let totalDepth = 0

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    let depthToReach = (await getIntFromRequest(request, DEPTH_TO_REACH)) - 1

    console.log(`[fetch] enqueuing ${MESSAGES_TO_ENQUEUE} messages with depthToReach=${depthToReach}`)
    for (let i = 0; i < MESSAGES_TO_ENQUEUE; i++) {
      await env.QUEUE.send({ depthToReach, currentDepth: 0 })
    }
    return new Response('ok')
  },

  async queue(batch: MessageBatch<any>, env: Env, executionCtx: ExecutionContext) {
    for (let message of batch.messages) {
      activeMessagesCount++

      const { depthToReach, currentDepth } = message.body
      const remainingDepth = depthToReach - currentDepth

      const log = (text = '') => {
        console.log(`[queue message ${message.id}] ${text} (depth: ${currentDepth})`)
      }

      try {
        await env.DATA.get('foo')

        if (remainingDepth > 0) {
          log(`remaining depth: ${remainingDepth},`)
          await env.QUEUE.send({ depthToReach, currentDepth: currentDepth + 1 })
          if (currentDepth > 1) totalDepth++
        } else {
          log(`reached depth ${depthToReach}: stopping`)
          if (currentDepth > 1) totalDepth -= depthToReach - 2
        }

        activeMessagesCount--
        processedMessagesCount++
      } catch (e: any) {
        console.error(
          `[queue message ${
            message.id
          } Exception] (depth: ${currentDepth}, totalDepth: ${totalDepth}, processed messages: ${processedMessagesCount}, currently active messages in this instance: ${activeMessagesCount})\n${
            e?.stack || e
          }`
        )
        processedMessagesCount++
        activeMessagesCount--
        throw e
      }
    }
  },
}

async function getIntFromRequest(req: Request, defaultValue: number) {
  if (defaultValue <= 0) throw new Error('default value must be greater than 0')
  const text = await req.text()
  let n = parseInt(text) || 0
  if (n <= 0) n = defaultValue
  if (n > 100) n = 100
  return n
}
