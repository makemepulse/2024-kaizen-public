/* eslint-disable @typescript-eslint/no-explicit-any */

import { ColorInputParams, FolderApi, ListItem, MonitorBindingApi, ButtonApi } from "@tweakpane/core";
import { InputBindingApi, ListApi, Pane, InputParams } from "tweakpane";
import { Color, Control, Gui } from "./api";
import { VecColorInputPlugin } from "./plugins/tp-color";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import { RadioGridBladeParams } from "@tweakpane/plugin-essentials/dist/types/radio-grid/blade-plugin";
import * as TweakpaneRotationInputPlugin from "@0b5vr/tweakpane-plugin-rotation";
import { quat } from "gl-matrix";
import { InputChunkPlugin } from "./plugins/input-binding";
// import * as TweakpaneThumbnailListPlugin from 'tweakpane-plugin-thumbnail-list'
// import { Thumbnail } from "tweakpane-plugin-thumbnail-list/src/controller";

class QuatWrapper {
  constructor(public q: quat) { }

  get x() { return this.q[0]; }
  set x(v: number) { this.q[0] = v; }

  get y() { return this.q[1]; }
  set y(v: number) { this.q[1] = v; }

  get z() { return this.q[2]; }
  set z(v: number) { this.q[2] = v; }

  get w() { return this.q[3]; }
  set w(v: number) { this.q[3] = v; }
}

const root = new Pane();
const _allFolders: TPGui[] = [];

function deleteAllEmptyFolders() {
  for (let i = _allFolders.length - 1; i >= 0; i--) {
    _allFolders[i]._deleteEmptyFolders();
  }
}

root.registerPlugin({ plugin: VecColorInputPlugin });
root.registerPlugin({ plugin: InputChunkPlugin });
root.registerPlugin(EssentialsPlugin);
root.registerPlugin(TweakpaneRotationInputPlugin);
// root.registerPlugin( TweakpaneThumbnailListPlugin )

const _controlsByTarget = new WeakMap<any, Control<any>[]>();

function registerCtrl(target: any, ctrl: Control<any>) {
  let l = _controlsByTarget.get(target);
  if (!l) {
    l = [];
    _controlsByTarget.set(target, l);
  }
  l.push(ctrl);
}

type PrimitiveValue<T> = {
  rawValue: T
}

type ControlInput<T> = InputBindingApi<unknown, T> | ListApi<T> | MonitorBindingApi<T> | ButtonApi

class TweakControl<T> implements Control<T> {

  _listeners: ((v: T) => void)[] = []

  constructor(private input: ControlInput<any>, private getter: () => T) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    input.on("change", () => {
      this._listeners.forEach(l => l(getter()));
    });

  }

  valueOf(): T {
    return this.getter();
  }

  get value(): T {
    return this.getter();
  }

  onChange(cb: (v: T) => void): this {
    this._listeners.push(cb);
    return this;
  }

  setLabel(s: string): this {
    this.input.label = s;
    return this;
  }

  setHint(s: string): this {
    const el = this.input.controller_.view.element;
    const input = el.querySelector("input, button") as HTMLElement;
    if (input) input.title = s;
    return this;
  }

  remove(): void {
    this.input.dispose();
    deleteAllEmptyFolders();
  }

}

type RadioItem<T> = {
  title: string, value: T
}

type TPGui = Gui & {
  _getPane(): FolderApi
  _createFolder(name: string): TPGui
  _deleteEmptyFolders(): void
}


function _factory(pane: FolderApi) {

  const _folders = new Map<string, TPGui>();

  function createFoldersRecursivly(dirs: string[]): TPGui {
    let cgui = gui;
    for (const fname of dirs) {
      if (fname !== "")
        cgui = cgui._createFolder(fname) as TPGui;
    }
    return cgui;
  }


  function resolvePath(label: string): { gui: TPGui, label: string } {
    const a = label.split("/");
    if (a.length === 1) {
      return { gui, label };
    } else {
      label = a.pop();
      const gui = createFoldersRecursivly(a);
      return { gui, label };
    }
  }


  const gui: TPGui = {



    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, opts?: InputParams): Control<O[Key]> {
      const input = pane.addInput(tgt, prop, opts);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl(tgt, ctrl);
      return ctrl;
    },

    range<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, min: number, max: number, opts?: InputParams): Control<O[Key]> {
      return this.add(tgt, prop, { ...opts, min, max });
    },

    monitor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      const input = pane.addMonitor(tgt, prop);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl(tgt, ctrl);
      return ctrl;
    },


    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      const alpha = tgt[prop].length === 4;
      const opts: ColorInputParams = { view: "color", alpha, picker: "inline", };
      const input = pane.addInput(tgt, prop, opts);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl(tgt, ctrl);
      return ctrl;
    },

    addRotation<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<quat> {
      const r = tgt[prop];
      const o = { [prop]: new QuatWrapper(r) };
      // const o = {q:{x:r[0],y:r[1],z:r[2],w:r[3]}}
      const input = pane.addInput(o, prop, {
        view: "rotation",
        rotationMode: "quaternion", // optional, 'quaternion' by default
        picker: "inline", // or 'popup'. optional, 'popup' by default
        expanded: true, // optional, false by default
      });
      const ctrl = new TweakControl<quat>(input, () => tgt[prop]);
      registerCtrl(tgt, ctrl);
      return ctrl;
    },


    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, pOptions: Record<string, O[Key]> | O[Key][]): Control<O[Key]> {
      let options: ListItem<O[Key]>[];

      if (Array.isArray(pOptions)) {
        options = pOptions.map(v => ({ text: String(v), value: v }));
      } else {
        options = Object.entries(pOptions).map(e => ({ text: e[0], value: e[1] }));
      }


      const list = pane.addInput(tgt, prop, {
        options
      });
      return new TweakControl(list, () => tgt[prop]);

    },


    addRadios<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, options: O[Key][]): Control<O[Key]> {
      const ctrl = gui.radios(prop, options);
      ctrl.onChange(v => tgt[prop] = v);
      registerCtrl(tgt, ctrl);
      return ctrl;
    },


    btn(name: string, fn: (name?: string) => void): Control<undefined> {
      const { label: title, gui } = resolvePath(name);
      const btn = gui._getPane().addButton({ title });
      btn.on("click", () => fn(title));
      return new TweakControl(btn, () => undefined);
    },


    btns(btns: Record<string, (name?: string) => void>, label = ""): void {

      const cells = Object.entries(btns).map(v => ({ title: v[0], cbk: v[1] }));
      const grid: any = pane.addBlade({
        view: "buttongrid",
        size: [cells.length, 1],
        cells: (x: number) => cells[x],
        label,
      });

      grid.on("click", (ev: any) => {
        cells[ev.index[0]].cbk();
      });

    },



    select<T>(name: string, o: Record<string, T> | T[], v?: T): Control<T> {

      const { label, gui } = resolvePath(name);
      let options: ListItem<T>[];

      if (Array.isArray(o)) {
        options = o.map(v => ({ text: String(v), value: v }));
      } else {
        options = Object.entries(o).map(e => ({ text: e[0], value: e[1] }));
      }

      const list: ListApi<T> = gui._getPane().addBlade({
        view: "list",
        label,
        options,
        value: v ?? options[0].value,
      }) as ListApi<T>;

      return new TweakControl(list, () => list.value);
    },




    radios<T>(name: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/): Control<T> {

      const { label, gui } = resolvePath(name);
      let options: RadioItem<T>[];

      if (Array.isArray(o)) {
        options = o.map(v => ({ title: String(v), value: v }));
      } else {
        options = Object.entries(o).map(e => ({ title: e[0], value: e[1] }));
      }

      const params: RadioGridBladeParams<T> = {
        view: "radiogrid",
        cells: (x: number) => options[x],
        groupName: label,
        size: [options.length, 1],
        label,
        options,
        value: options[0].value,
      };
      const list: ListApi<PrimitiveValue<T>> = gui._getPane().addBlade(params) as ListApi<PrimitiveValue<T>>;

      return new TweakControl(list, () => list.value.rawValue);
    },


    folder(name: string): TPGui {
      return createFoldersRecursivly(name.split("/"));
    },

    clearTarget(tgt: any): void {
      const ctrls = _controlsByTarget.get(tgt);
      if (ctrls) {
        ctrls.forEach(ctrl => ctrl.remove());
        _controlsByTarget.delete(tgt);
      }
    },

    clearFolder(name: string): void {
      console.log("clearFolder", name);

      const folder = _folders.get(name);
      _folders.delete(name);
      const index = _allFolders.indexOf(folder);
      if (index >= 0) {
        _allFolders.splice(index, 1);
      }
      folder?.clear();
    },

    clear(): void {
      for (const c of pane.children) {
        pane.remove(c);
      }
      pane.dispose();
    },

    open(): TPGui {
      pane.expanded = true;
      return this;
    },

    close(): TPGui {
      pane.expanded = false;
      return this;
    },


    _createFolder(name: string): TPGui {
      let folder = _folders.get(name);
      if (!folder) {
        folder = _factory(pane.addFolder({
          title: name,
          expanded: false
        }));
        _folders.set(name, folder);
        _allFolders.push(folder);
      }
      return folder;
    },


    _getPane(): FolderApi {
      return pane;
    },

    _deleteEmptyFolders(): void {

      const foldersNames = _folders.keys();
      for (const name of foldersNames) {
        const folder = _folders.get(name);
        if (folder._getPane().children.length === 0) {
          this.clearFolder(name);
        }
      }
    }

  };

  return gui;

}



/// #if DEBUG
let gui: TPGui | null = _factory(root);
_allFolders.push(gui);
/// #else
gui = null;
/// #endif



// ===================================================================
// FPS
// ===================================================================
const fpsGraph = root.addBlade({
  view: "fpsgraph",
  label: "fpsgraph",
  lineCount: 2,
});

fpsGraph.controller_.view.element.addEventListener("dblclick", () => {
  root.controller_.view.element.style.display = "none";
});

export const fpsCtrl: any = fpsGraph;
// function render() {
//   fpsCtrl.begin();
//   fpsCtrl.end();
//   requestAnimationFrame(render);
// }

// render()

export default gui;
