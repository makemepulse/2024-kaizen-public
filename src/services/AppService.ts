/// #if DEBUG
import gui from "@webgl/dev/gui";
/// #endif
import AppResources from "@/services/AppResources";
import {
  CreateAppStateInterpreter,
  AppStateInterpreter,
} from "@/services/states/AppStateMachine";
// import GameScene from "@webgl/GameScene";
import type GLApp from "@webgl/GLApp";
import type GameScene from "@webgl/GameScene";

export class AppServiceClass {
  private static _instance: AppServiceClass;

  glapp: GLApp;
  state: AppStateInterpreter;

  resources: AppResources;

  static getInstance() {
    if (!AppServiceClass._instance) {
      AppServiceClass._instance = new AppServiceClass();
    }
    return AppServiceClass._instance;
  }

  get Scene(): GameScene {
    return this.glapp.renderer.scene;
  }

  constructor() {
    // /// #if DEBUG
    // gui.btn("Save Game", () => this.saveGame());
    // gui.btn("Clear Save", () => this.clearSave());
    // /// #endif

    this.state = CreateAppStateInterpreter();

    if (process.env.VUE_APP_COMING_SOON === 'true') return;
    this.resources = new AppResources();

  }

  async createGlApp() {
    const module = await import("@webgl/GLApp")
    await import("@webgl/Features");
    this.glapp = new module.default()
    await this.glapp.createGlAppElements()

  }

  async start() {
    await this.createGlApp()
    this.state.start();
    this.state.send({ type: "INIT" });

    if (process.env.VUE_APP_COMING_SOON === 'true') return;
    this.glapp.start();


    /// #if DEBUG
    window.addEventListener("keydown", this.showDebugTools)
    /// #endif
  }

  /// #if DEBUG
  showDebugTools(e: KeyboardEvent) {
    if (e.key.toLowerCase() === "t") {
      document.documentElement.classList.toggle("show-tweakpane");
    } else if (e.key.toLowerCase() === "d") {
      document.documentElement.classList.toggle("show-theatrejs");
    }
  }
  /// #endif
}

const AppService = AppServiceClass.getInstance();

export default AppService;
