export { TodoTs } from './todo'
import { Request, Router } from 'itty-router'

const router = Router()

router.get('/todos', listTodos)
router.get('/todos/:id', getTodo)
router.post('/todos/:id', postTodo)
router.post('/todos', postTodo)
router.delete('/todos/:id', deleteTodo)
router.all('*', () => new Response('404 not found', { status: 404 }))

export default {
  fetch: router.handle,
}

async function listTodos(req: Request, env: Env) {
  const keys: KVNamespaceListResult<unknown> = await env.TODOS.list({
    limit: 100,
  })
  const ids: string[] = keys.keys.map((k) => k.name)
  return new Response(JSON.stringify({ ids }))
}

async function getTodo(req: Request, env: Env) {
  const id: string | undefined = req.params?.id
  if (id === undefined || id === '') {
    return new Response('id param not found', { status: 400 })
  }
  if ((await env.TODOS.get(id)) === null) {
    return new Response('todo not found', { status: 404 })
  }

  const objId = env.TODO.idFromString(id)
  const obj = env.TODO.get(objId)
  return obj.fetch(new Request(req.url, { method: 'GET' }))
}

async function postTodo(req: Request, env: Env) {
  let id: string | undefined = req.params?.id
  let objId: DurableObjectId
  if (id === undefined || id === '') {
    objId = env.TODO.newUniqueId()
  } else {
    objId = env.TODO.idFromString(id)
  }
  // @ts-ignore
  const data = await req.text()
  const obj = env.TODO.get(objId)
  const response = await obj.fetch(
    new Request(req.url, { method: 'POST', body: data }),
  )
  if (response.status !== 200) {
    throw new Error(`couldn't post DO ${objId.toString()}`)
  }
  await env.TODOS.put(objId.toString(), '')
  return new Response(JSON.stringify({ id: objId.toString() }))
}

async function deleteTodo(req: Request, env: Env) {
  const id: string | undefined = req.params?.id
  if (id === undefined || id === '') {
    return new Response('id param not found', { status: 400 })
  }
  await env.TODOS.delete(id)
  return new Response(JSON.stringify({ id }))
}

interface Env {
  TODO: DurableObjectNamespace
  TODOS: KVNamespace
}
