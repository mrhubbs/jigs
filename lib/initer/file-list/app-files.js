
module.exports = [
  // starter app script
  [
    'src/app/app.js',
`
import Vue from 'vue'
import { sync } from 'vuex-router-sync'

import { createRouter } from './router'
import { createStore } from './store'

import App from './App.vue'

export function createApp() {
  const router = createRouter()
  const store = createStore()

  sync(store, router)

  const app = new Vue({
    router,
    store,
    render: (h) => h(App),
  })

  return { app, router, store }
}
`
  ],
  // client entry
  [
    'src/app/entry-client.js',
`
// /* eslint-disable no-underscore-dangle */
import { createApp } from './app'

const { app, router, store } = createApp()

router.onReady(() => {
  if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
  }

  app.$mount('#app')
})

if (module.hot) {
  const api = require('vue-hot-reload-api')
  const Vue = require('vue')

  api.install(Vue)
  if (!api.compatible) {
    throw new Error(
      'vue-hot-reload-api is not compatible with the version of Vue you are using.',
    )
  }

  module.hot.accept()
}`
  ],
  // server entry
  [
    'src/app/entry-server.js',
`
import { createApp } from './app'

export default (context) =>
  new Promise((resolve, reject) => {
    const { app, router, store } = createApp()
    const meta = app.$meta()

    // set server-side router's location
    router.push(context.url)
    context.meta = meta

    // wait until router has resolved possible async components and hooks
    router.onReady(() => {
      context.rendered = () => {
        // After the app is rendered, our store is now
        // filled with the state from our components.
        // When we attach the state to the context, and the \`template\` option
        // is used for the renderer, the state will automatically be
        // serialized and injected into the HTML as \`window.__INITIAL_STATE__\`.
        context.state = store.state
      }

      const matchedComponents = router.getMatchedComponents()
      // no matched routes, reject with 404
      if (!matchedComponents.length) {
        return reject(new Error(404))
      }

      // the Promise should resolve to the app instance so it can be rendered
      return resolve(app)
    }, reject)
  })`
  ],
  // starter router script
  [
    'src/app/router.js',
`
import Vue from 'vue'
import Router from 'vue-router'
import VueMeta from 'vue-meta'

import jigsRuntime from '@Jigs/runtime'
import generatedRoutes from './generated-routes.js'

Vue.use(Router)
Vue.use(VueMeta)

export function createRouter() {
  // set up 404
  let routes = [
    ...generatedRoutes,
    // You're free to edit this however you want to handle 404 - this is just a
    // starting point.
    { path: '*', component: () => import('@Jigs/runtime/components/404.vue') }
  ]

  // create the router
  const router = new Router({
    mode: 'history',
    routes: routes
  })

  // hook jigs into it
  jigsRuntime.setUpRouter(router, routes)

  return router
}`
  ],
  // store
  [
    'src/app/store.js',
`
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const createStore = () =>
  new Vuex.Store({
    state: { },
    mutations: { },
    actions: { },
    getters: { }
  })`
  ],
  // app component
  [
    'src/app/App.vue',
`
<script>
  export default {
    name: 'app',
    components: { },
    metaInfo: {
      title: 'A New Jigs Project',
    },
    render(h) {
      return (
        <div id='app'>
          <router-view></router-view>
        </div>
      )
    }
  }
</script>`
  ],
  // index page
  [
    'src/pages/Index.vue',
`<template>
  <basepage>
    <div>
      Index page (from a .vue file)

      <router-link to='/markdown'>markdown page</router-link>
    </div>
  </basepage>
</template>

<script>
  import Basepage from '@Layouts/Basepage.vue'

  export default {
    name: 'index',
    components: { Basepage }
  }
</script>`
  ],
  // example markdown component
  [
    'src/app/components/MarkdownComponent.md',
`---
type: markdown-component
---

# Drumroll!!

A reusable chunk of markdown!!!`
  ],
  [
    'src/app/.gitignore',
`generated-routes.js`
  ],
  [
    'src/app/components/Test.vue',
`<template>
  <div>
    Only a
    <span class='font-bold'>
      {{ thing }}
    </span>
  </div>
</template>

<script>
  export default {
    name: 'Test',
    props: [ 'thing' ]
  }
</script>`
  ],
  // example markdown page
  [
    'src/pages/markdown.md',
`---
title: Markdown
layout: Basepage
---

This page is from a .md file.

<br />

<!-- We can import and use components in Markdown -->
import Test from '@Components/Test.vue'
<test thing='test'/>

<br />

<!-- We can even import and use components that are written in Markdown -->
import ExampleMarkdownComponent from '@Components/MarkdownComponent.md'
<!-- Almost but not quite... -->
<example-markdown-component/>

<br />

# Markdown

  - markdown!
  - markdown!
  - markdown!

<br />

<router-link to='/'>back to homepage</router-link>`
  ]
]
