
import Vue from 'vue'

export const jigsRuntimeEventBus = new Vue()

export const setUpRouter = (router, routes) => {
  // TODO: make sure this is removed in production and for server build
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV === 'development' && BUILD_ENV === 'client') {
    router
    routes
    // does nothing...
  }
}

export default {
  setUpRouter,
  jigsRuntimeEventBus
}
