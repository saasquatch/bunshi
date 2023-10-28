import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { generateTypeDoc } from "starlight-typedoc";

const apiSidebarGroup = await generateTypeDoc({
  output: "reference/vanilla",
  sidebar: {
    label: "Vanilla Reference",
    collapsed: true,
  },

  entryPoints: ["../src/vanilla/index.ts"],
  tsconfig: "../src/vanilla/tsconfig.docs.json",
});

const reactSidebar = await generateTypeDoc({
  output: "reference/react",
  sidebar: {
    label: "React Reference",
    collapsed: true,
  },
  entryPoints: ["../src/react/index.ts"],
  tsconfig: "../src/react/tsconfig.docs.json",
});
const vueSidebar = await generateTypeDoc({
  output: "reference/vue",
  sidebar: {
    label: "Vue Reference",
    collapsed: true,
  },
  entryPoints: ["../src/vue/index.ts"],
  tsconfig: "../src/vue/tsconfig.docs.json",
});

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Bunshi",
      favicon: "./public/favicon.ico",
      logo: {
        src: "./src/assets/bunshi.svg",
      },
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
      ],
      social: {
        github: "https://github.com/saasquatch/bunshi",
      },
      sidebar: [
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Integrations",
          autogenerate: { directory: "integrations" },
        },
        {
          label: "Advanced",
          autogenerate: { directory: "advanced" },
        },
        reactSidebar,
        vueSidebar,
        apiSidebarGroup,
      ],
    }),
  ],
});
