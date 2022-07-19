# Next RPC Experiment

This repository tries to explore new patterns and ways to solve the Server Client typing.

The goals of this project is to create a tiny RPC lib that focuses on

- zero configuration (_no codegen, no buildsystem patches_)
- serverless support (_build time code splitting_)
- edge runtime support
- type inference server-client
- runtime type checking where it makes sence
- cacheability (_queries only_)

## Strategy

Define your queries & mutations inside multiple serverless edge functions.

### Server

**File:** `api/posts.ts`

```js
import { z } from "zod";
import createRPCHandler from "../../lib/create-rpc-handler";

export const config = {
  runtime: "experimental-edge",
};

const rpcHandler = createRPCHandler()
  .query("myMethodName", {
    input: z.object({
      id: z.string(),
    }),
    resolve({ id }) {
      return { id, title: "Building a next rpc client" };
    },
  })
  .mutation("delete", {
    input: z.object({
      id: z.string(),
    }),
    resolve({ id }) {
      return {
        id,
        removed: true,
      };
    },
  })

export default rpcHandler.handle()

// Future:
// Infer the type of the RPCClient from the RPC handler.
// Please note that this api is a WIP and not yet fully specified
declare global {
  export type RPCClient = rpcHandler.infer<'posts'>
}
```

### Client

This experiment also exposes a tiny dump RPCClient that soly depends on the inferred typescript type from the serverless edge functions.
It is based on a recursive proxy pattern and has no runtime information of the different api functions.

This api client configures itself by usage:

**Syntax:**

```js
api.<pathSegment*n>.<rpcMethodName>.$query(Input, ReqInit): Promise<ReturnType>
api.<pathSegment*n>.<rpcMethodName>.$mutate(Input, ReqInit): Promise<ReturnType>
```

**Usage:**

```js
const { id, title } = await api.posts.myMethodName.$query({
  id: "42",
});
```

When using this client, typescript will inform the developer what is possible and what not. This information should be inferred from the RPCHandler.

## Install

    $ yarn

## Development

    yarn run dev

## Production

    yarn run build && yarn run start

## Todo

- [x] create rpc-handler internal inferred runtime checks
- [x] create rpc-client
- [ ] infer `RPCClient` from `createRPCHandler`
- [ ] expose react-query hooks
- [ ] create req context configurator (webmiddleware pattern)
- [ ] create benchmarks
