import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  publicPaths: ["/api/demo/start"],
  rootAuth: false,
  marketing: false,
});
