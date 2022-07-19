enum RPCType {
  $query = "$query",
  $mutate = "$mutate",
}

export async function defaultFetchFactory(url: URL, requestInit: RequestInit) {
  const response = await fetch(url, requestInit);
  return response.json();
}

export default function createRPCClient<T>({
  fetchFactory = defaultFetchFactory,
} = {}) {
  return (function createRecursiveProxy(segments: string[] = []) {
    return new Proxy(
      {},
      {
        get(_: unknown, segment: string): unknown {
          switch (segment) {
            case RPCType.$query:
            case RPCType.$mutate: {
              const rpcType = segment as RPCType;
              const rpcMethodName = segments.pop();
              const rpcPath = segments.join("/");
              const isMutation = rpcType === RPCType.$mutate;

              if (!rpcMethodName)
                throw new Error("You need to provide a method name");

              const url = new URL(
                `/api/${rpcPath}`,
                globalThis.location.origin
              );
              url.searchParams.set("method", rpcMethodName);

              return (data: unknown, requestInit: RequestInit = {}) => {
                if (!isMutation) {
                  url.searchParams.set("input", JSON.stringify(data));
                }
                return fetchFactory(url, {
                  method: isMutation ? "POST" : "GET",
                  body: isMutation ? JSON.stringify(data) : undefined,
                  ...requestInit,
                  headers: {
                    "Content-Type": "application/json",
                    ...requestInit.headers,
                  },
                });
              };
            }
            default: {
              return createRecursiveProxy([...segments, segment]);
            }
          }
        },
      }
    );
  })() as unknown as T;
}
