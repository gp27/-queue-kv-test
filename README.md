### Reproducible KV GET/PUT failed: 503 Service Temporarily Unavailable

This simple workers works like this:

- it sets a counter starting from 10 as the message body (you can POST a number between 0 and 100 in the HTML body, if you want to start from another value)
- the fetch handler sends the counter to the queue which makes kv operations and then triggers another queue message with a decremented counter
- when the count reaches 0 no more messages are sent to the queue

To reproduce:

- initialize a kv entry with:
  `npx wrangler kv:key put foo bar --binding DATA --preview false`
- deploy the worker with logpush enabled (queues logs don't go through wrangler tail apparently)
- make a get call to `https://queue-kv-test.<organization>.workers.dev/`

The error seems to appear after 5 queue message have been processed
