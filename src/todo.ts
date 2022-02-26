export class TodoTs {
  state: DurableObjectState

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
  }
  async fetch(request: Request) {
    if (request.method === 'POST') {
      // creating new DO
      const data = await request.text()
      await this.state.storage?.put('value', data)
      return new Response(data, { status: 200 })
    }
    // returning value from DO
    const value = await this.state.storage?.get('value')
    return new Response(
      JSON.stringify({ id: this.state.id.toString(), value: value ?? '' }),
      { status: 200 },
    )
  }
}

interface Env {}
