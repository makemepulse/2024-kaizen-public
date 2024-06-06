import AppService from "../AppService";
import { assign, createMachine, interpret } from "xstate";
import { StepIds } from "../models/ArchivesModel";
import type TheatreHandle from "@webgl/theatre/theatre";
import { ActivityId } from "@webgl/activities/ActivityRegistry";
import { addLoaded, setToLoad } from "@/store/modules/WebglLoading";
import { AppEvent, MobileGoToOrigami, GoToScene, SetStep } from "./AppEvents";
import type ArchivesManager from "@webgl/activities/Archives/ArchivesManager";
import { loadSRT } from "@/utils/Subtitles";
import { trackPage } from "@/utils/Gtm";
import { getSubtitleContent } from "@/store/modules/Subtitles";


function checkJump() {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  return searchParams.has("scene");
}

function CreateContext() {
  return {
    loaded: false,
    firstscenesloaded: false,
    progressiveloaded: false,
    score: 0,
    step: 0 as number,
    mobileOrigamiId: "noOrigami" as mobileOrigamiId,
    sceneId: 1 as number,
    sceneStep: 0 as number,
    isHolding: false,
    theatreProject: null as null | TheatreHandle,
    archiveTransition: false,

    // INTRO
    introReady: false,
    introLoaded: false,
    showTitle: false,
    introSkipped: false,

    // PORTAIL
    hasReachedPortail: false,
    isLeavingPortail: false,
  };
}

export type AppStateContext = ReturnType<typeof CreateContext>;

export type AppStateType = {
  value: string;
  context: AppStateContext;
};

export type mobileOrigamiId = "noOrigami" | "papillon" | "carpe" | "grenouille" | "grue";

// TODO Lazy load activities
const idsActivitiesStart: ActivityId[] = ["intro", "scene1", "scene2", "scene3", "scene4", "outroduction", "conclusion", "brushes", "archives"];

// =====
// UTILS
// =====
async function createIntroActivities() {
  await AppService.Scene.activities.createActivity("intro");
}

async function createActivities(id: ActivityId[]) {
  await Promise.all(id.filter(id => id !== "intro").map((id) => AppService.Scene.activities.createActivity(id)));
}

function loadActivity(id: ActivityId) {
  return function(): Promise<unknown> {
    return AppService.Scene.activities.loadActivity(id);
  };
}

function startActivity(id: ActivityId) {
  return function() {
    AppService.Scene.activities.startActivity(id);
  };
}

function stopActivity(id: ActivityId) {
  return function() {
    AppService.Scene.activities.stopActivity(id);
  };
}

// =====
// INITIAL STATE TARGET
// =====
let INIT_TARGET = "initializing";

// SKIP INTRO
/// #if DEBUG
if (
  process.env.VUE_APP_SKIP_INTRO === "true"
  // || UrlParams.getBool("skip-intro") ||
  // UrlParams.getString("load-save")
) {
  INIT_TARGET = "initializing.load_remaining_resources";
}
/// #endif

let JUMP_TARGET = "#app.intro";
// let JUMP_TARGET = "#app.scene";
// let JUMP_TARGET = "#app.portail";

// JUMP TO STATE
/// #if DEBUG
if (
  process.env.VUE_APP_JUMP_STATE === "true" && process.env.VUE_APP_JUMP_STATE_TARGET
) {
  JUMP_TARGET = process.env.VUE_APP_JUMP_STATE_TARGET as string;
}
/// #endif

function CreateAppStateMachine() {
  return createMachine<AppStateContext, AppEvent, AppStateType>(
    {
      predictableActionArguments: true,

      id: "app",

      initial: "initial",

      context: CreateContext(),

      states: {
        // STATE INIT
        initial: {
          on: {
            INIT: {
              target: INIT_TARGET,
            },
          },
        },

        initializing: {
          initial: "create_intro",
          entry: [() => trackPage({ location: "loading", title: "loading" })],
          states: {
            create_intro: {
              invoke: [
                {
                  src: "createIntroActivity",
                  onDone: {
                    target: "#app.initializing.load_intro_resources"
                  },
                },
              ]
            },
            load_intro_resources: {
              invoke: [
                {
                  src: "loadIntro",
                  onDone: {
                    target: "#app.initializing.load_remaining_resources"
                  },
                },
              ],
            },
            load_remaining_resources: {
              invoke: [
                {
                  id: "load-activites-start",
                  src: "loadActivitesStart",
                  onDone: {
                    actions: (ctx) => (ctx.loaded = true),
                    target: "#app.initializing.loaded"
                  },
                },
              ],
            },
            loaded: {
              entry: [() => AppService.glapp.startProfile()],
              always: [
                { target: "#app.scene", cond: "hasJump", actions: ["checkJumpTarget"] },
                { target: JUMP_TARGET, cond: "isJumpTargetNotIntro", actions: [stopActivity("intro")] },
                { target: JUMP_TARGET }
              ]
            }
          },
        },

        intro: {
          initial: "loader",
          exit: [stopActivity("intro"), "hideTitle"],
          states: {
            loader: {
              initial: "loading",
              states: {
                loading: {
                  on: {
                    NEXT: {
                      target: "#app.intro.loader.ready",
                    }
                  }
                },
                ready: {
                  on: {
                    NEXT: {
                      target: "#app.intro.loader.showHeadPhones",
                    }
                  }
                },
                showHeadPhones: {
                  after: {
                    3000: {
                      target: "#app.intro.create_activities"
                    }
                  }
                },
              }
            },
            create_activities: {
              invoke: [
                {
                  src: "createActivities",
                  onDone: {
                    target: "#app.intro.voice_over"
                  },
                },
              ],
            },
            voice_over: {
              entry: ["conditionalStartIntro", () => trackPage({ location: "intro", title: "intro" })],
              invoke: [
                {
                  id: "load-activites-progressive",
                  src: "loadProgressiveActivitesStart",
                  onDone: {
                    actions: (ctx) => {
                      ctx.firstscenesloaded = true;
                      ctx.progressiveloaded = true;
                    }
                  },
                },
              ],
              on: {
                INTRO_READY: {
                  actions: (ctx) => (ctx.introReady = true),
                },
                SKIP_INTRO: {
                  actions: (ctx) => (ctx.introSkipped = true),
                },
                SET_SHOW_TITLE: {
                  actions: "setShowTitle",
                },
                NEXT: {
                  target: "#app.intro.waitloading.start",
                },
              },
            },
            waitloading: {
              states: {
                start: {
                  always: [
                    { target: "#app.scene", cond: "firstSceneLoaded" },
                    { target: "#app.intro.waitloading.wait" }

                  ]
                },
                wait: {
                  after: {
                    1000: "#app.intro.waitloading.start"
                  }
                }
              }
            },
          },
        },

        origami: {
          exit: "stopActivityScene",
          after: {
            1: [
              { target: "#app.portail", cond: "hasReachedPortail" },
              { actions: "incrementSceneId", cond: "hasNextScene", target: "#app.scene" },
              { target: "#app.conclusion" }
            ]
          }
        },

        scene: {
          initial: "idle",
          entry: [(ctx) => trackPage({ location: `scene${ctx.sceneId}`, title: `scene${ctx.sceneId}` })],
          on: {
            SCENE_FINISH: {
              target: "#app.scene.outro",
              internal: true,
            },
          },
          states: {
            idle: {
              entry: "startActivityScene",
              always: "interacting"
            },
            interacting: {
              initial: "idle",
              on: {
                SUCCESS_INTERACTION: {
                  target: ".success",
                },
                PERFECT_INTERACTION: {
                  target: ".perfect",
                },
                INCREMENT_SCENE_STEP: {
                  actions: "incrementSceneStep",
                },
                DECREMENT_SCENE_STEP: {
                  actions: "decrementSceneStep",
                },
                HOLDING: {
                  actions: "setIsHolding",
                },
                RELEASING: {
                  actions: "setIsReleasing",
                },
              },
              states: {
                idle: {
                },
                success: {
                  on: {
                    BACK_TO_INTERACTION_IDLE: {
                      target: "idle",
                    },
                  },
                },
                perfect: {
                  after: {
                    100: {
                      target: "#app.scene.interacting.idle",
                      internal: true,
                    },
                  },
                },
              },
            },
            outro: {
              on: {
                GO_TO_QUOTE: {
                  // target: "#app.conclusion"
                  target: "quote",
                  actions: "resetSceneStep",
                },
              },
            },
            quote: {
              always: {
                target: "#app.origami",
              },
              on: {
                NEXT_ORIGAMI: {
                  target: "#app.origami",
                },
                GO_TO_OUTRODUCTION: {
                  target: "#app.outroduction",
                },
              },
            },
          },
        },

        outroduction: {
          initial: "intro",
          states: {
            intro: {
              on: {
                SKIP: {
                  target: "#app.portail",
                },
                GO_ABOUT: {
                  target: "#app.about",
                },
              },
            },
          },
        },

        conclusion: {
          initial: "running",
          entry: [() => trackPage({ location: "outro", title: "outro" })],
          states: {
            idle: {
              entry: [startActivity("conclusion")],
              always: "running",
            },
            running: {
              entry: [startActivity("conclusion")],
              exit: [stopActivity("conclusion")],
              on: {
                GO_TO_QUOTE: {
                  target: "#app.portail",
                },
                GO_ABOUT: {
                  target: "#app.about",
                },
              },
            },
          },
        },

        portail: {
          initial: "idle",
          entry: [
            assign({ hasReachedPortail: true, isLeavingPortail: false }),
            () => trackPage({ location: "portail", title: "portail" })
          ],
          on: {
            LEAVE_PORTAIL: {
              actions: "leavePortail",
            },
            GO_TO_SCENE: { target: "#app.scene" },
          },
          states: {
            idle: {
              entry: [startActivity("archives")],
              always: [
                { target: "running" },
                // { target: "running", actions: (ctx) => (ctx.step = 0) },
              ]
            },
            running: {
              exit: [stopActivity("archives")],
              on: {
                SET_STEP: {
                  actions: "setStep",
                },
                NEXT: {
                  // cond: "hasNext",
                  actions: "next"
                },
                PREV: {
                  // cond: "hasPrev",
                  actions: "prev"
                },
                RESET_SCROLL: {
                  actions: "reset"
                },
                NEXT_ORIGAMI: {
                  target: "#app.origami",
                },
                GO_ABOUT: {
                  target: "#app.about",
                },
                ARCHIVE_TRANSITION: {
                  actions: (ctx, evt) => (ctx.archiveTransition = evt.isInTransition),
                }
              },
            }
          },
        },

        about: {
          initial: "idle",
          entry: [() => trackPage({ location: "credits", title: "credits" })],
          states: {
            idle: {
              on: {
                PREV: {
                  target: "#app.portail",
                },
              }
            },
          },
        },

      },
    },

    {
      actions: {
        // createActivites() {
        //   createActivities(idsActivitiesStart);
        // },
        // createIntroActivity() {
        //   createIntroActivities();
        // },
        checkJumpTarget(ctx) {
          /// #if DEBUG
          const url = new URL(window.location.href);
          const searchParams = new URLSearchParams(url.search);
          if (searchParams.has("scene")) {
            ctx.sceneId = Number(searchParams.get("scene"));
          }
          /// #endif
        },
        // createTheatreProject(ctx) {
        //   ctx.theatreProject = new TheatreHandle();
        // },
        setStep: (ctx, evt: SetStep) => {
          if (evt.step < 0 && evt.step >= StepIds.length) {
            return;
          }

          ctx.step = evt.step;
        },
        next: (ctx) => {
          if (ctx.step <= StepIds.length) {
            ctx.step++;
          }
        },
        prev: (ctx) => {
          if (ctx.step > 0) {
            ctx.step--;
          }
        },
        reset: (ctx) => {
          ctx.step = ctx.step === 0 ? StepIds.length - 1 : 0;
        },
        setOrigamiId: (ctx, evt) => {
          ctx.mobileOrigamiId = (evt as MobileGoToOrigami).origamiId as mobileOrigamiId;
        },
        resetOrigamiId: (ctx) => {
          ctx.mobileOrigamiId = "noOrigami" as mobileOrigamiId;
        },
        setSceneId: (ctx, evt) => {
          console.log("set scene id " + (evt as GoToScene).sceneId);
          ctx.sceneId = (evt as GoToScene).sceneId as number;
        },
        incrementSceneId: (ctx) => {
          ctx.sceneId++;
          // console.log("increment scene id " + ctx.sceneId);
        },
        incrementSceneStep: (ctx) => {
          ctx.sceneStep++;
          // console.log("increment scene step " + ctx.sceneStep);
        },
        decrementSceneStep: (ctx) => {
          ctx.sceneStep--;
          // console.log("decrement scene step " + ctx.sceneStep);
        },
        resetSceneStep: (ctx) => {
          ctx.sceneStep = 0;
        },
        setIsHolding: (ctx) => {
          ctx.isHolding = true;
        },
        setIsReleasing: (ctx) => {
          ctx.isHolding = false;
        },
        setShowTitle: (ctx) => {
          ctx.showTitle = true;
        },
        hideTitle: (ctx) => {
          ctx.showTitle = false;
        },
        startActivityOrigami: (ctx) => {
          startActivity("origami" + ctx.sceneId as ActivityId)();
        },
        stopActivityOrigami: (ctx) => {
          stopActivity("origami" + ctx.sceneId as ActivityId)();
        },
        startActivityScene: (ctx) => {
          startActivity("scene" + ctx.sceneId as ActivityId)();
        },
        stopActivityScene: (ctx) => {
          stopActivity("scene" + ctx.sceneId as ActivityId)();
        },
        conditionalStartIntro: (ctx) => {
          /// #if DEBUG
          if (!checkJump()) {
            AppService.Scene.activities.startActivity("intro");
          }
          /// #else
          AppService.Scene.activities.startActivity("intro");
          /// #endif
        },
        leavePortail: (ctx, evt) => {
          ctx.sceneId = (evt as GoToScene).sceneId as number;
          ctx.isLeavingPortail = true;
          const activeActivity = AppService.Scene.activities.active[0];
          (activeActivity as ArchivesManager).animeOut();
        },
      },

      services: {
        async createIntroActivity(ctx) {
          const module = await import("../../webgl/theatre/theatre");
          ctx.theatreProject = new module.default();
          await AppService.Scene.createTexturePool();
          await createIntroActivities();
        },
        async createActivities() {
          await createActivities(idsActivitiesStart);
        },
        async loadIntro(ctx) {
          setToLoad(4);
          /// #if DEBUG
          if (checkJump() || JUMP_TARGET !== "#app.intro") {
            const AssetDatabase = (await import("@webgl/resources/AssetDatabase"));
            AssetDatabase.handlerest();
            setToLoad(idsActivitiesStart.length + 3);
            const module = await import("@/core/audio/AudioManager");
            module.default.progressiveLoading();
            AppService.Scene.loadTransition();
          }
          /// #endif
          await loadSRT("audio/subtitles/0_introduction_vo.srt").then(() => addLoaded())
          await Promise.all(
            [
              loadActivity("intro")()
            ].map(
              p => p.then(() => addLoaded())
            )
          );
          ctx.introLoaded = true;
        },
        async loadActivitesStart(ctx) {
          const toLoad: Promise<unknown>[] = [];

          // load game scene first
          await AppService.Scene.load();
          addLoaded();

          /// #if DEBUG
          if (checkJump() || JUMP_TARGET !== "#app.intro") {
            await createActivities(idsActivitiesStart);
            toLoad.push(...idsActivitiesStart.filter((id) => id !== "intro").map((id) => loadActivity(id)()));
          }
          /// #endif

          toLoad.push(ctx.theatreProject.load());

          await Promise.all(
            toLoad.map((p) => p.then(
              () => addLoaded()
            ))
          );
        },
        async loadProgressiveActivitesStart(ctx) {
          const AssetDatabase = (await import("@webgl/resources/AssetDatabase"));
          AssetDatabase.handlerest();
          /// #if DEBUG
          if (checkJump() || JUMP_TARGET !== "#app.intro") {
            return Promise.resolve();
          }
          /// #endif
          const module = await import("@/core/audio/AudioManager");


          module.default.progressiveLoadingPart1();
          const toLoad1 = idsActivitiesStart.filter((id) => id === "scene1" || id === "scene2").map((id) => loadActivity(id)());
          toLoad1.push(
            getSubtitleContent("audio/subtitles/chapter1_1.srt"),
            getSubtitleContent("audio/subtitles/chapter1_2.srt"),
            getSubtitleContent("audio/subtitles/chapter1_3.srt"),
            getSubtitleContent("audio/subtitles/chapter1_4.srt"),
            getSubtitleContent("audio/subtitles/chapter2_1.srt"),
            getSubtitleContent("audio/subtitles/chapter2_2.srt"),
            getSubtitleContent("audio/subtitles/chapter2_3.srt"),
            getSubtitleContent("audio/subtitles/chapter2_4.srt"),
          );
          await Promise.all(
            toLoad1.map((p) => p)
          );
          ctx.firstscenesloaded = true

          module.default.progressiveLoadingPart2();
          const toLoad = idsActivitiesStart.filter((id) => id !== "intro" && id !== "scene1" && id !== "scene2" && id !== "archives" && id !== "brushes").map((id) => loadActivity(id)());
          await Promise.all(
            toLoad.map((p) => p)
          );

          const toLoad2 = idsActivitiesStart.filter((id) => id === "archives" || id === "brushes").map((id) => loadActivity(id)());
          toLoad2.push(AppService.Scene.loadTransition());
          await Promise.all(
            toLoad2.map((p) => p)
          );
          ctx.progressiveloaded = true
        },
      },

      guards: {
        firstSceneLoaded: (ctx) => {
          return ctx.firstscenesloaded
        },
        isSkipped: () => {
          return process.env.VUE_APP_SKIP_TUTORIAL && process.env.VUE_APP_SKIP_TUTORIAL === "true";
        },
        hasNext: (ctx) => {
          return ctx.step <= StepIds.length;
        },
        hasNextScene: (ctx) => {
          return ctx.sceneId <= StepIds.length - 1;
        },
        hasPrev: (ctx) => {
          return ctx.step > 0;
        },
        hasJump: () => {
          /// #if DEBUG
          return checkJump();
          /// #endif
        },
        isJumpTargetNotIntro: () => {
          return JUMP_TARGET !== "#app.intro";
        },
        hasReachedPortail: (ctx) => {
          return ctx.hasReachedPortail;
        }
      },
    }
  );
}

export function CreateAppStateInterpreter() {
  const res = interpret(CreateAppStateMachine());

  res.onTransition((state, evt) => {
    let currentState = state.value;
    if (typeof currentState === "object") {
      const keys = Object.keys(state.value);
      if (keys.length > 0) {
        currentState = keys[0];
      }
    }

    document.body.className = currentState.toString();
  });


  /// #if DEBUG
  // res.onTransition((state, evt) => {
  //   console.debug("====================================");
  //   console.debug(`[Event]: `, evt);
  //   console.debug(`[App]: `, state.value);
  //   for (const c in state.children) {
  //     const snapshot = state.children[c].getSnapshot();
  //     console.debug(`   [${c}]: `, JSON.stringify(snapshot?.value));
  //     // console.debug(`   [${c} Context]: `, snapshot?.context);
  //   }
  //   console.debug("====================================");
  // });
  /// #endif

  return res;
}

export type AppStateInterpreter = ReturnType<typeof CreateAppStateInterpreter>;
