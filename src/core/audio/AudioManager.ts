import Delay from "../Delay";
import UISprite from "./ui.json";
import HoldSprite from "./hold.json";
import PortalSprite from "./portail.json";
import Chapter1Sprite from "./chapter1.json";
import Chapter2Sprite from "./chapter2.json";
import Chapter3Sprite from "./chapter3.json";
import Chapter4Sprite from "./chapter4.json";
import ReactionsSprite from "./reactions.json";
import { Howl, Howler, HowlOptions } from "howler";
import { setReactionDuration, setReactionName, setShowReaction, setSoundUrl, setSubtitleShowed } from "@/store/modules/Audio";

export enum AUDIO_ID {
  INTRO = "0_intro_music",
  INTRO_VO = "0_intro_vo",
  INTRO_VO_PART2 = "0_intro_part2_vo",
  UI = "ui",
  REACTIONS = "reactions",
  PORTAL = "portal",
  CONCLUSION = "5_conclusion_vo_a",
  CONCLUSION_MMP = "ui_conclusion_kaizen",
  BUTTERFLY = "chapter1",
  FISH = "chapter2",
  FROG = "chapter3",
  CRANE = "chapter4",
  AMBIENT_BUTTERFLY = "ambient/1_chapter_butterfly_music_2537-67053",
  AMBIENT_FISH = "ambient/2_chapter_fish_music",
  AMBIENT_FROG = "ambient/3_chapter_frog_music",
  AMBIENT_CRANE = "ambient/4_chapter_crane_music",
  AMBIENT_CONCLUSION = "ambient/5_conclusion_music",
  AMBIENT_LAYER_BUTTERFLY = "ambient/kaizen_ch1_amb_1000-21000",
  AMBIENT_LAYER_FISH = "ambient/kaizen_ch2_amb_1000-21000",
  AMBIENT_LAYER_FROG = "ambient/kaizen_ch3_amb_1000-21000",
  AMBIENT_LAYER_CRANE = "ambient/kaizen_ch4_amb_1000-21000",
  HOLD = "hold",
  // MUSIC = "KAIZEN_MUSIC_4847-174566",
  // AMBIENCE = "KAIZEN_AMBIENCE_1000-29000",
  // UI_CLICK = "CLICK-SOUND",
}
export const SCENE_AUDIO_ID: AUDIO_ID[] = [
  AUDIO_ID.BUTTERFLY,
  AUDIO_ID.FISH,
  AUDIO_ID.FROG,
  AUDIO_ID.CRANE,
];

export const SCENE_AUDIO_AMBIENT_ID: AUDIO_ID[] = [
  AUDIO_ID.AMBIENT_BUTTERFLY,
  AUDIO_ID.AMBIENT_FISH,
  AUDIO_ID.AMBIENT_FROG,
  AUDIO_ID.AMBIENT_CRANE,
];

export const SCENE_AUDIO_AMBIENT_LAYER_ID: AUDIO_ID[] = [
  AUDIO_ID.AMBIENT_LAYER_BUTTERFLY,
  AUDIO_ID.AMBIENT_LAYER_FISH,
  AUDIO_ID.AMBIENT_LAYER_FROG,
  AUDIO_ID.AMBIENT_LAYER_CRANE,
];

const SRT_PATHS: Map<AUDIO_ID, string> = new Map([
  [AUDIO_ID.BUTTERFLY, "chapter1"],
  [AUDIO_ID.FISH, "chapter2"],
  [AUDIO_ID.FROG, "chapter3"],
  [AUDIO_ID.CRANE, "chapter4"],
]);

type Bounds = { bounds: [number, number] };

export class AudioLib {
  _audio: Map<AUDIO_ID, Howl> = new Map<AUDIO_ID, Howl>();
  ambients: number[];
  ambientLevel = 1;
  ambience: Howl;
  _muted = false;

  constructor() {
    Howler.autoSuspend = false;
    Howler.html5PoolSize = 0;
    Howler.usingWebAudio = true;

    // AMBIENT
    // this.addAudio(AUDIO_ID.MUSIC, { loop: true, volume: 1, bounds: [4847, 174566] })
    // this.ambience = this.addAudio(AUDIO_ID.AMBIENCE, {
    //   loop: true,
    //   volume: 1,
    //   bounds: [1000, 29000]
    // })
    this.addAudio(AUDIO_ID.AMBIENT_BUTTERFLY, { loop: false, volume: 0, preload: false, sprite: { "intro": [0, 2537], "main": [2537, 64516, true] } });
    this.addAudio(AUDIO_ID.AMBIENT_FISH, { loop: true, volume: 0, preload: false });
    this.addAudio(AUDIO_ID.AMBIENT_FROG, { loop: true, volume: 0, preload: false });
    this.addAudio(AUDIO_ID.AMBIENT_CRANE, { loop: true, volume: 0, preload: false });
    this.addAudio(AUDIO_ID.AMBIENT_CONCLUSION, { loop: true, volume: 0, preload: false });

    this.addAudio(AUDIO_ID.AMBIENT_LAYER_BUTTERFLY, { loop: false, volume: 0, preload: false, sprite: {"intro": [0, 1000] ,"main": [1000, 20000, true] } });
    this.addAudio(AUDIO_ID.AMBIENT_LAYER_FISH, { loop: false, volume: 0, preload: false, sprite: {"intro": [0, 1000] ,"main": [1000, 20000, true] } });
    this.addAudio(AUDIO_ID.AMBIENT_LAYER_FROG, { loop: false, volume: 0, preload: false, sprite: {"intro": [0, 1000] ,"main": [1000, 20000, true] } });
    this.addAudio(AUDIO_ID.AMBIENT_LAYER_CRANE, { loop: false, volume: 0, preload: false, sprite: {"intro": [0, 1000] ,"main": [1000, 20000, true] } });

    // INTERACTIONS
    this.addAudio(AUDIO_ID.INTRO, { volume: 1 });
    this.addAudio(AUDIO_ID.INTRO_VO, { volume: 1 });
    this.addAudio(AUDIO_ID.INTRO_VO_PART2, { volume: 1, preload: false });
    // this.addAudio(AUDIO_ID.UI_CLICK, { volume: 0.3 })

    // CONCLUSION
    this.addAudio(AUDIO_ID.CONCLUSION, { volume: 1, preload: false });
    this.addAudio(AUDIO_ID.CONCLUSION_MMP, { volume: 1, preload: false });

    if (process.env.VUE_APP_SOUND_OFF === "true") {
      Howler.volume(0);
    }

    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
    // document.addEventListener("visibilitychange", () => {
    //   if (document.visibilityState === "visible") {
    //     Howler.mute(false);
    //   } else {
    //     Howler.mute(true);
    //   }
    // });
  }

  handleVisibilityChange() {
    Howler.mute(document.visibilityState !== "visible");
  }

  getVolume() {
    return Howler.volume();
  }

  setMute(flag: boolean) {
    Howler.volume(flag ? 0 : 1);
  }

  getAudio(id: AUDIO_ID) {
    return this._audio.get(id);
  }

  load(id: AUDIO_ID) {
    const howl = this._audio.get(id);
    if (howl) howl.load();
  }

  progressiveLoading() {
    this.progressiveLoadingPart1();
    this.progressiveLoadingPart2();
  }

  progressiveLoadingPart1() {
    // INTRO PART 2
    this.load(AUDIO_ID.INTRO_VO_PART2);
    this.load(AUDIO_ID.BUTTERFLY);
    this.load(AUDIO_ID.AMBIENT_BUTTERFLY);
    this._audio.set(AUDIO_ID.BUTTERFLY, new Howl(Chapter1Sprite as any));
    this.load(AUDIO_ID.AMBIENT_LAYER_BUTTERFLY);
    this._audio.set(AUDIO_ID.FISH, new Howl(Chapter2Sprite as any));

    // REACTIONS
    this._audio.set(AUDIO_ID.REACTIONS, new Howl(ReactionsSprite as any));

    // HOLD
    this._audio.set(AUDIO_ID.HOLD, new Howl(HoldSprite as any));

    this.load(AUDIO_ID.AMBIENT_FISH);
    this.load(AUDIO_ID.AMBIENT_LAYER_FISH);

    this.load(AUDIO_ID.FISH);

    this.load(AUDIO_ID.HOLD);

  }

  progressiveLoadingPart2() {

    // CHAPTERS
    this._audio.set(AUDIO_ID.FROG, new Howl(Chapter3Sprite as any));
    this._audio.set(AUDIO_ID.CRANE, new Howl(Chapter4Sprite as any));

    // PORTAL
    this._audio.set(AUDIO_ID.PORTAL, new Howl(PortalSprite as any));

    // UI
    this._audio.set(AUDIO_ID.UI, new Howl(UISprite as any));


    this.load(AUDIO_ID.AMBIENT_FROG);
    this.load(AUDIO_ID.AMBIENT_CRANE);
    this.load(AUDIO_ID.AMBIENT_CONCLUSION);

    this.load(AUDIO_ID.AMBIENT_LAYER_FROG);
    this.load(AUDIO_ID.AMBIENT_LAYER_CRANE);

    this.load(AUDIO_ID.CONCLUSION);
    this.load(AUDIO_ID.CONCLUSION_MMP);

    this.load(AUDIO_ID.UI);
    this.load(AUDIO_ID.FROG);
    this.load(AUDIO_ID.CRANE);

    this.load(AUDIO_ID.PORTAL);
  }

  play(id: AUDIO_ID) {
    const howl = this._audio.get(id);
    if (!howl || howl.playing()) return;
    howl.seek(0);
    const intro = (howl as any)._sprite.intro ? "intro" : undefined;
    if(intro === undefined){
      const sprite = (howl as any)._sprite.main ? "main" : undefined;
      return howl.play(sprite);
    }
    else{
      howl.off("fade");
      const introPartId = howl.play(intro);
      howl.once("end", () => {
        howl.play("main");
      }, introPartId);
    }
  }

  playReactions(name: string, volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.REACTIONS);
    if (!howl || howl.playing()) return;

    const soundId = howl.play(name);
    howl.volume(volume, soundId);

    setShowReaction(true);
    setReactionName(name);
    setReactionDuration((howl as any)._sprite[name][1] * 0.001); // get duration from sprite in seconds
  }

  playReactionsBrute(name: string, volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.REACTIONS);
    if (!howl) return;

    const soundId = howl.play(name);
    howl.volume(volume, soundId);
  }

  playUI(name: string, volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.UI);
    if (!howl) return;
    if(howl.playing()) howl.stop();

    const soundId = howl.play(name);
    howl.volume(volume, soundId);
  }

  playPortal(sceneId: number, variation: string, volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.PORTAL);
    if (!howl || howl.playing()) return;

    setSubtitleShowed(true);
    setSoundUrl("audio/subtitles/portal" + sceneId + ".srt");

    const soundId = howl.play("ui_menu_scene" + sceneId + "_vo_" + variation);
    howl.volume(volume, soundId);
  }

  playIntro () {
    setSoundUrl("audio/subtitles/0_introduction_vo.srt");
    this.fadeIn(AUDIO_ID.INTRO, 0.75);
    this.fadeIn(AUDIO_ID.INTRO_VO);
    setSubtitleShowed(true);
  }

  skipIntro () {
    this.fadeOut(AUDIO_ID.INTRO_VO, 500).then(() => {
    
      const howl = this._audio.get(AUDIO_ID.INTRO);
      if(howl.playing()) howl.stop();
  
      // const soundId = howl.play("chapter_" + sceneID + "_hold");
      howl.seek(33.5);
      howl.play();
      howl.off("fade");
      howl.fade(0.0, 0.75, 1000);
    });
  }

  playIntroPart2 () {
    setSoundUrl("audio/subtitles/0_introduction_part2_vo.srt");
    this.fadeIn(AUDIO_ID.INTRO_VO_PART2);
    setSubtitleShowed(true);
  }

  playConclusion() {
    this.fadeIn(AUDIO_ID.AMBIENT_CONCLUSION, 0.75, 3);
    this.fadeIn(AUDIO_ID.CONCLUSION, 0.75, 3);
    setSubtitleShowed(true);
    setSoundUrl("audio/subtitles/5_conclusion_vo.srt");
  }

  playVoice(sceneID: number, voiceIndex: number, volume = 1.0) {
    const howl = this._audio.get(SCENE_AUDIO_ID[sceneID-1]);
    if (!howl || howl.playing()) return;

    setSubtitleShowed(true);
    setSoundUrl("audio/subtitles/" + SRT_PATHS.get(SCENE_AUDIO_ID[sceneID-1]) + "_" + voiceIndex + ".srt");

    const soundId = howl.play("chapter_" + sceneID + "_vo_" + voiceIndex);
    howl.volume(volume, soundId);
  }

  playHold(sceneID: number, holdValue: number, volume = 0.75, duration = 100) {
    const howl = this._audio.get(AUDIO_ID.HOLD);
    if (!howl) return;
    if(howl.playing()) howl.stop();

    // const soundId = howl.play("chapter_" + sceneID + "_hold");
    howl.seek(holdValue);
    howl.play("kaizen_ch-"+sceneID+"_hold");
    howl.off("fade");
    howl.fade(howl.volume(), volume, duration);

    return new Promise((resolve) => {
      howl.once("fade", resolve);
    });
  }

  stopHold(sceneID: number, fadeDuration = 500) {
    this.fadeOut(AUDIO_ID.HOLD, fadeDuration);
  }

  playSuperJump(volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.HOLD);
    if (!howl) return;

    const soundId = howl.play("kaizen_ch-all_superjump");
    howl.volume(volume, soundId);
  }

  playNextSuperJump(volume = 1.0) {
    const howl = this._audio.get(AUDIO_ID.HOLD);
    if (!howl) return;
    if(howl.playing()) howl.stop();

    const soundId = howl.play("kaizen_ch-all_nextsuperjumps");
    howl.volume(volume, soundId);
  }

  async playVoiceWithDelay(sceneID: number, voiceIndex: number, volume = 1.0, delay = 2000) {
    await Delay(delay);
    const howl = this._audio.get(SCENE_AUDIO_ID[sceneID-1]);
    if (!howl || howl.playing()) return;

    setSubtitleShowed(true);
    setSoundUrl("audio/subtitles/" + SRT_PATHS.get(SCENE_AUDIO_ID[sceneID-1]) + "_" + voiceIndex + ".srt");

    const soundId = howl.play("chapter_" + sceneID + "_vo_" + voiceIndex);
    howl.volume(volume, soundId);
  }

  stop(id: AUDIO_ID) {
    this._audio.get(id).stop();
  }

  fadeOut(id: AUDIO_ID, duration = 1000): Promise<number> {
    const howl = this._audio.get(id);
    howl.off("fade");
    howl.fade(howl.volume(), 0, duration);
    return new Promise((resolve) => {
      howl.once("fade", resolve);
    });
  }

  async fadeOutWithDelay(id: AUDIO_ID, delay = 0, duration = 1000): Promise<number> {
    await Delay(delay);
    const howl = this._audio.get(id);
    howl.off("fade");
    howl.fade(howl.volume(), 0, duration);
    return new Promise((resolve) => {
      howl.once("fade", resolve);
    });
  }

  // startAmbient() {
  //   this.ambients = [this.play(AUDIO_ID.MUSIC), this.play(AUDIO_ID.MUSIC_HOTSPOT)]
  //   this.updateAmbientLevels()
  // }

  // addAmbient() {
  //   this.ambients.length < 3 && this.ambients.push(this.play(AUDIO_ID.AMBIENCE))
  // }

  // setAmbientLevel(level: 1 | 2) {
  //   console.log("Ambient level", level)

  //   gsap.killTweensOf(this, "ambientLevel")
  //   gsap.to(this, {
  //     ambientLevel: level,
  //     duration: 1,
  //     onUpdate: () => {
  //       this.updateAmbientLevels()
  //     }
  //   })
  // }

  // updateAmbientLevels() {
  //   let v: number

  //   v = clamp01(1 - Math.abs(this.ambientLevel - 1))
  //   this.getAudio(AUDIO_ID.MUSIC).volume(v)

  //   v = clamp01(1 - Math.abs(this.ambientLevel - 2))
  //   this.getAudio(AUDIO_ID.MUSIC_HOTSPOT).volume(v)
  // }

  fadeIn(id: AUDIO_ID, volume = 1.0, duration = 1000): Promise<number> {
    const howl = this._audio.get(id);

    if (!howl.playing()) this.play(id);

    howl.off("fade");
    howl.fade(howl.volume(), volume, duration);

    return new Promise((resolve) => {
      howl.once("fade", resolve);
    });
  }

  async fadeInWithDelay(id: AUDIO_ID, volume = 1.0, delay = 0, duration = 1000): Promise<number> {
    await Delay(delay);
    const howl = this._audio.get(id);

    if (!howl.playing()) this.play(id);

    howl.off("fade");
    howl.fade(howl.volume(), volume, duration);

    return new Promise((resolve) => {
      howl.once("fade", resolve);
    });
  }

  fadeOutStop(id: AUDIO_ID, duration = 1000) {
    this.fadeOut(id, duration).then(() => this.stop(id));
  }

  addAudio(id: AUDIO_ID, opts: Partial<HowlOptions & Bounds> = {}) {
    const _opts = {
      preload: true,
      autoplay: false,
    };

    if (opts.bounds) {
      opts.sprite = { main: [opts.bounds[0], opts.bounds[1] - opts.bounds[0]] };
    }
    Object.assign(_opts, opts);

    const fileName = id;

    const howl = new Howl({
      src: [`/audio/${fileName}.mp3`],
      ..._opts,
    });

    this._audio.set(id, howl);

    return howl;
  }
}

const _instance = new AudioLib();

export default _instance;
