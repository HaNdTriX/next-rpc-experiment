import { useEffect, useState } from "react";
import api from "../lib/api";

export default function IndexPage() {
  const [state, setState] =
    useState<Awaited<ReturnType<typeof api.posts.get.$query>>>();

  useEffect(() => {
    const controller = new AbortController();

    api.posts.get
      .$query({
        id: "123",
      })
      .then(setState);

    return () => {
      controller.abort();
    };
  }, []);

  if (!state) return "Loading...";

  return <pre>{JSON.stringify(state, null, 2)}</pre>;
}
