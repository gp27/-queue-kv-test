export interface Env {
  DATA: KVNamespace
  QUEUE: Queue<any>
}

let kvCallsCount = 0

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const text = await request.text()
    let n = parseInt(text) || 0
    if (n <= 0) n = 10
    if (n > 100) n = 100

    await env.DATA.put('count', n.toString())
    kvCallsCount++

    console.log(`[fetch] count: ${n}`)
    await env.QUEUE.send({})
    return new Response('ok')
  },

  async queue(batch: MessageBatch<any>, env: Env, executionCtx: ExecutionContext) {
    for (let message of batch.messages) {
      try {
        const count = (await env.DATA.get('count')) || '0'
        kvCallsCount++

        let n = +count || 0
        console.log(`[queue message ${message.id}] count: ${n}`)
        n--

        if (n > 0) {
          await env.DATA.put('count', n.toString())
          kvCallsCount++

          await env.QUEUE.send({})
          continue
        }

        console.log(`[queue message ${message.id}] reached end of count`)
        await env.DATA.delete('count')
        kvCallsCount++
      } catch (e: any) {
        console.error(e?.stack || e, `kv calls: ${kvCallsCount}`)
        throw e
      }
    }
  },
}
