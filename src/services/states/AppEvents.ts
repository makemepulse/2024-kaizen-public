import { mobileOrigamiId } from "./AppStateMachine";

export type AppInitEvent = { type: "INIT" };
type AppRestart = { type: "RESTART" };
type AppGamePause = { type: "PAUSE_GAME" };
type AppGameResume = { type: "RESUME_GAME" };
type SceneLaunch = { type: "SCENE_LAUNCH" };
type SceneFinish = { type: "SCENE_FINISH" };
type SuccessInteraction = { type: "SUCCESS_INTERACTION" };
type PerfectInteraction = { type: "PERFECT_INTERACTION" };
type IncrementSceneStep = { type: "INCREMENT_SCENE_STEP" };
type DecrementSceneStep = { type: "DECREMENT_SCENE_STEP" };
type Holding = { type: "HOLDING" };
type Releasing = { type: "RELEASING" };
type SetShowTitle = { type: "SET_SHOW_TITLE" };
type BackToInteractionIdle = { type: "BACK_TO_INTERACTION_IDLE" };
type GoToQuote = { type: "GO_TO_QUOTE" };
type BackToMobile = { type: "BACK_TO_MOBILE" };
export type MobileGoToOrigami =
  { type: "GO_TO_ORIGAMI", origamiId: mobileOrigamiId }
type NextOrigami = { type: "NEXT_ORIGAMI" };
type GoToOutroduction = { type: "GO_TO_OUTRODUCTION" };
type GoAbout = { type: "GO_ABOUT" };
export type GoToScene = { type: "GO_TO_SCENE", sceneId: number };
type PaintingDone = { type: "PAINTING_DONE" };
type ResetScroll = { type: "RESET_SCROLL" };
type Next = { type: "NEXT" };
type Prev = { type: "PREV" };
type Skip = { type: "SKIP" };
export type SetStep = { type: "SET_STEP", step: number };
type ArchiveTransition = { type: "ARCHIVE_TRANSITION", isInTransition: boolean };
type StartIntroTimeline = { type: "CAN_START_INTRO_TIMELINE" };
type IntroDotsFinished = { type: "INTRO_DOTS_FINISHED" };
type SkipIntro = { type: "SKIP_INTRO" };
type introReady = { type: "INTRO_READY" };
type LeavePortail = { type: "LEAVE_PORTAIL" };

export type AppEvent =
  | AppRestart
  | AppInitEvent
  | AppGamePause
  | AppGameResume
  | SuccessInteraction
  | IncrementSceneStep
  | DecrementSceneStep
  | Holding
  | Releasing
  | SetShowTitle
  | PerfectInteraction
  | BackToInteractionIdle
  | GoToQuote
  | BackToMobile
  | MobileGoToOrigami
  | NextOrigami
  | GoToOutroduction
  | GoAbout
  | GoToScene
  | PaintingDone
  | ResetScroll
  | Next
  | Prev
  | Skip
  | SetStep
  | SceneLaunch
  | SceneFinish
  | ArchiveTransition
  | StartIntroTimeline
  | IntroDotsFinished
  | SkipIntro
  | introReady
  | LeavePortail;
