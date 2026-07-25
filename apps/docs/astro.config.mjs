import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightClientMermaid from "@pasqal-io/starlight-client-mermaid";

export default defineConfig({
  site: "https://docs.handoverkey.app",
  integrations: [
    starlight({
      title: "HandoverKey",
      description:
        "Open-source zero-knowledge digital legacy platform with a dead man's switch.",
      social: {
        github: "https://github.com/handoverkey/handoverkey",
      },
      editLink: {
        baseUrl:
          "https://github.com/handoverkey/handoverkey/edit/main/apps/docs/",
      },
      customCss: ["./src/styles/custom.css"],
      plugins: [starlightClientMermaid()],
      components: {
        Head: "./src/components/Head.astro",
      },
      defaultLocale: "en",
      lastUpdated: true,
      pagination: true,
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Quick Start", slug: "guides/quick-start" },
            { label: "Deployment", slug: "guides/deployment" },
          ],
        },
        {
          label: "How It Works",
          items: [
            { label: "Architecture", slug: "guides/architecture" },
            { label: "Security Model", slug: "guides/security" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "API Reference", slug: "reference/api" },
            { label: "Testing", slug: "reference/testing" },
          ],
        },
        {
          label: "Project",
          items: [
            { label: "Contributing", slug: "contributing" },
            { label: "Troubleshooting", slug: "troubleshooting" },
            { label: "Changelog", slug: "changelog" },
            {
              label: "← handoverkey.app",
              link: "https://handoverkey.app",
              attrs: { target: "_blank", rel: "noopener noreferrer" },
            },
          ],
        },
      ],
    }),
  ],
});
