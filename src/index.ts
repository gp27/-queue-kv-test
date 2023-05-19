export interface Env {
  DATA: KVNamespace
  QUEUE: Queue<number>
}

let kvCallsCount = 0

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const text = await request.text()
    let n = parseInt(text) || 0
    if (n <= 0) n = 10
    if (n > 100) n = 100

    console.log(`[fetch] messages to be processed: ${n}`)
    await env.QUEUE.send(n)
    return new Response('ok')
  },

  async queue(batch: MessageBatch<any>, env: Env, executionCtx: ExecutionContext) {
    for (let message of batch.messages) {
      try {
        await env.DATA.get('foo')
        kvCallsCount++
        await env.DATA.get('foo')
        kvCallsCount++
        await env.DATA.get('foo')
        kvCallsCount++

        if (message.body > 0) {
          console.log(`[queue message ${message.id}], messages to be processed: ${message.body - 1},  kv ops count: ${kvCallsCount}`)
          await env.QUEUE.send(message.body - 1)
        } else {
          console.log(`[queue message ${message.id}], no more messages to process, kv ops count: ${kvCallsCount}`)
        }
      } catch (e: any) {
        console.error(e?.stack || e, `kv ops count: ${kvCallsCount}`)
        throw e
      }
    }
  },
}
