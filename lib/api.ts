import createRPCClient from "./create-rpc-client";

// Here we can configure the api client in the future
// Add auth credentials and so on.
// How the client looks like is beeing defined by the global RPCClient type.
const api = createRPCClient<RPCClient>();

export default api;
