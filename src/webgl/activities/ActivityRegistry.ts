import type Renderer from "@webgl/Renderer";

export const ActivityRegistry = {
  brushes: '',
  intro: '',
  // ARCHIVES
  archives: '',
  // SCENES
  scene1: '',
  scene2: '',
  scene3: '',
  scene4: '',
  outroduction: '',
  conclusion: ''
} as const;

export type ActivityId = keyof typeof ActivityRegistry;

export const ActivityFactory = {
  async create(id: ActivityId, renderer: Renderer) {
    console.log("create activity", id)
    switch (id) {
      case "scene1":
        // eslint-disable-next-line no-case-declarations
        const { default: Scene1 } = await import("./Scene1/Scene1");
        console.log("get scene 1")
        return new Scene1(renderer, 1);
      case "scene2":
        // eslint-disable-next-line no-case-declarations
        const { default: Scene2 } = await import("./Scene2/Scene2");
        return new Scene2(renderer, 2);
      case "scene3":
        // eslint-disable-next-line no-case-declarations
        const { default: Scene3 } = await import("./Scene3/Scene3");
        return new Scene3(renderer, 3);
      case "scene4":
        // eslint-disable-next-line no-case-declarations
        const { default: Scene4 } = await import("./Scene4/Scene4");
        return new Scene4(renderer, 4);
      case "outroduction":
        // eslint-disable-next-line no-case-declarations
        const { default: Outroduction } = await import("./Outroduction/Outroduction");
        return new Outroduction(renderer);
      case "conclusion":
        // eslint-disable-next-line no-case-declarations
        const { default: Conclusion } = await import("./Conclusion/Conclusion");
        return new Conclusion(renderer);
      case "brushes":
        // eslint-disable-next-line no-case-declarations
        const { default: BrushesManager } = await import("./Brushes/BrushesManager");
        return new BrushesManager(renderer);
      case "intro":
        // eslint-disable-next-line no-case-declarations
        const { default: Intro } = await import("./Intro/Intro");
        return new Intro(renderer);
      case "archives":
        // eslint-disable-next-line no-case-declarations
        const { default: ArchivesManager } = await import("./Archives/ArchivesManager");
        return new ArchivesManager(renderer);
    }
  },
};
