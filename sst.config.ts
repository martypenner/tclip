/// <reference path="./.sst/platform/config.d.ts" />

import path from "node:path";

export default $config({
  app(input) {
    return {
      name: "tclip",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
      providers: {
        tailscale: true,
        docker: true,
        cloudflare: true,
      },
    };
  },
  async run() {
    const tailnetKey = new tailscale.TailnetKey("tclipTailnetKey", {
      reusable: true,
      ephemeral: true,
      preauthorized: true,
      expiry: 60 * 60 * 24 * 7,
    });

    const appNetwork = new docker.Network("tclip-network", {
      name: "tclip-network",
      driver: "bridge",
    });

    const appContainer = new docker.Container("tclip", {
      name: "tclip",
      image: "ghcr.io/tailscale-dev/tclip:multiarch",
      hostname: "tclip",
      networksAdvanced: [{ name: appNetwork.name }],
      restart: "unless-stopped",
      mounts: [
        {
          target: "/data",
          source: path.join(process.cwd(), "./data"),
          type: "bind",
          readOnly: false,
        },
      ],
      envs: [
        $interpolate`TS_AUTHKEY=${tailnetKey.key}`,
        `TSNET_HOSTNAME=tclip`,
        `TSNET_FORCE_LOGIN=1`,
      ],
    });
  },
});
