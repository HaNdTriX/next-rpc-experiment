import { z } from "zod";
import createRPCHandler from "../../lib/create-rpc-handler";

export const config = {
  runtime: "experimental-edge",
};

const apiHandler = createRPCHandler()
  .query("get", {
    input: z.object({
      id: z.string(),
    }),
    resolve({ id }) {
      return { id, title: "Building a next api client" };
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
  .mutation("update", {
    input: z.object({
      id: z.string(),
    }),
    resolve({ id }) {
      return {
        id,
        updated: true,
      };
    },
  });

// TODO: Infer this type from createRPCHandler (api)

declare global {
  interface RPCClient {
    posts: {
      get: {
        $query: (
          {
            id,
          }: {
            id: string;
          },
          requestInit?: RequestInit
        ) => Promise<{ id: string; title: string }>;
      };
      delete: {
        $mutate: (
          {
            id,
          }: {
            id: string;
          },
          requestInit?: RequestInit
        ) => Promise<{ id: string; title: string }>;
      };
      update: {
        $mutate: (
          {
            id,
          }: {
            id: string;
          },
          requestInit?: RequestInit
        ) => Promise<{ id: string; title: string }>;
      };
    };
  }
}

export default apiHandler.handle();
