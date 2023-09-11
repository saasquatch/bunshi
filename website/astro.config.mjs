import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
// import { generateTypeDoc } from 'starlight-typedoc';

// const typeDocSidebarGroup = await generateTypeDoc({
// 	entryPoints: ['../dist/index.d.ts'],
// 	tsconfig: '../tsconfig.json',
// })

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Bunshi',
			favicon: "./public/favicon.ico",
			logo: {
				src: "./src/assets/bunshi.svg",
			},
			customCss: [
				// Relative path to your custom CSS file
				'./src/styles/custom.css',
			],
			social: {
				github: 'https://github.com/saasquatch/bunshi',
			},
			sidebar: [
				{
					label: 'Concepts',
					autogenerate: { directory: 'concepts' },
				},
				{
					label: 'Integrations',
					autogenerate: { directory: 'integrations' },
				},
				{
					label: 'Advanced',
					autogenerate: { directory: 'advanced' },
				},
			],
		}),
	],
});
