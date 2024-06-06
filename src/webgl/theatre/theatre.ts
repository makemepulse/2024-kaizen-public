import { IProject, getProject } from "@theatre/core";
import projectState from "@/assets/webgl/kaizen.theatre-project-state.json";

/// #if DEBUG
import gui from "@webgl/dev/gui";
/// #endif

const THEATRE_PROJECT_NAME = "kaizen";

export default class TheatreHandle {

  project: IProject
  sequenceDebugEnabled = false;

  constructor() {
    this.project = getProject(THEATRE_PROJECT_NAME, { state: projectState });

    /// #if DEBUG
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    const withStudio = searchParams.has("withStudio");
    if (withStudio) {
      this.getStudio();
    }
    /// #endif
  }

  getStudio() {
    import("@theatre/studio").then(studio => {
      const folder = gui.folder("Theatre");
      folder.add(this, "sequenceDebugEnabled");
      studio.default.initialize();
    });

  }

  async load() {
    await this.project.ready;
  }


}