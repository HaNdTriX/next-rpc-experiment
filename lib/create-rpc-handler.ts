import type { NextRequest } from "next/server";
import { z } from "zod";

class JSONResponse extends Response {
  constructor(data: any, { ...rest } = {}) {
    super(JSON.stringify(data), {
      headers: {
        "content-type": "application/json",
      },
      ...rest,
    });
  }
}

type Resolver<T extends z.ZodType<object>> = {
  input: T;
  resolve: (input: z.infer<T>) => any;
};

type RPCHandlerConfig = {
  context?: any;
};

class RPCHandler {
  _config: RPCHandlerConfig;
  _mutations = new Map();
  _queries = new Map();

  constructor(config: RPCHandlerConfig) {
    this._config = config;
  }

  mutation<T extends z.ZodType<object>>(
    methodName: string,
    resolver: Resolver<T>
  ) {
    this._mutations.set(methodName, resolver);
    return this;
  }

  query<T extends z.ZodType<object>>(
    methodName: string,
    resolver: Resolver<T>
  ) {
    this._queries.set(methodName, resolver);
    return this;
  }

  handle() {
    return async (req: NextRequest) => {
      const isMutation = req.method === "POST";
      const resolvers = isMutation ? this._mutations : this._queries;
      const { searchParams } = new URL(req.url);
      const methodName = searchParams.get("method");

      if (!resolvers.has(methodName)) {
        return new JSONResponse(
          {
            name: "APIError",
            success: false,
            error: [
              {
                code: "invalid_method",
                received: req.method,
                expected: "POST | GET",
              },
            ],
          },
          {
            status: 405,
          }
        );
      }

      const { resolve, input } = resolvers.get(methodName);

      let dirtyInput;

      if (isMutation) {
        if (!req.body) {
          return new JSONResponse(
            {
              name: "APIError",
              success: false,
              error: [
                {
                  code: "invalid_input_body_format",
                },
              ],
            },
            {
              status: 400,
            }
          );
        }

        dirtyInput = await concatStringStream(req.body);
      } else {
        dirtyInput = searchParams.get("input");
      }

      try {
        var parsedInput = JSON.parse(dirtyInput || "{}");
      } catch (e) {
        return new JSONResponse(
          {
            name: "APIError",
            success: false,
            error: [
              {
                code: "invalid_input_format",
              },
            ],
          },
          {
            status: 400,
          }
        );
      }

      const validatedInput = await input.safeParseAsync(parsedInput);

      if (!validatedInput.success) {
        return new JSONResponse(validatedInput, {
          status: 400,
        });
      }

      const responseData = await resolve(validatedInput.data, {
        req,
        context: this._config.context,
      });

      return new JSONResponse(responseData);
    };
  }
}

export default function createRPCHandler(config = {}) {
  return new RPCHandler(config);
}

async function concatStringStream(stream: ReadableStream) {
  let result = "";
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) return result;
    result += value;
  }
}
