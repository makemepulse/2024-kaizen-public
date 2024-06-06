
import "@/styles/index.styl";

import { createApp } from "vue";

async function main() {
  const i18n = (await import("@/core/i18n")).default;
  const App = (await import("@/App.vue")).default;

  const app = createApp(App);
  
  app.use(i18n);
  
  app.mount("#app");
}

main();
