### Reproducible KV GET/PUT failed: 503 Service Temporarily Unavailable

This simple workers works like this:

- it sets a counter starting from 10 in the kv store when it gets a fetch call (you can POST a number between 0 and 100 in the body, if you want to start from another value)
- the fetch handler sends a message to the queue which decrements the kv value and triggers another queue message, until the count reaches 0
- the fetch makes 1 kv operation, each message in the queues makes 2 kv operations (1 get, 1 put)

To reproduce:

- deploy the worker with logpush enabled (queues logs don't go through wrangler tail apparently)
- make a get call to `https://queue-kv-test.<organization>.workers.dev/`

The error seems to appear during the 11th kv api call
