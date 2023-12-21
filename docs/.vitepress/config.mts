import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Syn: real-time editing shared state hApps',
  description: 'Documentation for the syn holochain engine',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/welcome-to-syn' },
      { text: 'Guides', link: '/building-a-simple-kanban-board-app' },
      { text: 'API', link: '/api/syn-store' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Welcome to Syn', link: '/welcome-to-syn' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Design', link: '/design' },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Building a simple kanban board app',
            link: '/building-a-simple-kanban-board-app',
          },
          {
            text: 'Building an app with ephemeral state',
            link: '/markdown-examples',
          },
          {
            text: 'Building an app with text editors',
            link: '/markdown-examples',
          },
        ],
      },
      {
        text: 'API Reference',
        items: [{ text: 'SynStore', link: '/api/syn-store' }],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
    search: {
      provider: 'local',
    },
  },
  base: '/syn/', // URL is https://holochain.github.io/syn
});
