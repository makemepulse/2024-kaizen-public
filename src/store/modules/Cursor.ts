import { reactive } from "vue";

export enum CursorState {
  DEFAULT,
  HOLD,
  CTA,
  NONE,
  WAIT,
}

export enum CursorTheme {
  DEFAULT = "dark", // Default
  LIGHT = "light",
}

type CursorOptions = {
  theme?: CursorTheme;
  label?: string;
  progress?: number;
  hint?: string;
};

const Cursor = reactive<{
  holding: boolean;
  active: boolean;
  hover: boolean;
  canScroll: boolean;
  prevCanScroll: boolean;
  state: CursorState;
  prevState: CursorState | null;
  options: CursorOptions;
}>({
  holding: false, // is mouse down ?
  active: false,
  hover: false,
  canScroll: false,
  prevCanScroll: false,
  state: CursorState.DEFAULT,
  prevState: null as CursorState | null,
  options: {
    theme: CursorTheme.DEFAULT,
    label: "",
    progress: 0,
    hint: "",
  },
});

export default Cursor;

export function setCursorActive(active: boolean) {
  Cursor.active = active;
  active
    ? document.documentElement.classList.add("remove-cursor")
    : document.documentElement.classList.remove("remove-cursor");
}

export function setCursorHover(hover: boolean) {
  Cursor.hover = hover;
  Cursor.canScroll = Cursor.prevCanScroll ? !hover : false;
}

export function setCursorCanScroll(canScroll: boolean) {
  Cursor.prevCanScroll = Cursor.canScroll;
  Cursor.canScroll = canScroll;
}

export function setCursorHolding(holding: boolean) {
  Cursor.holding = holding;
}

export function setCursor(
  state: CursorState = CursorState.DEFAULT,
  options?: CursorOptions
) {
  Cursor.prevState = Cursor.state;
  Cursor.state = state;
  Cursor.options = { ...Cursor.options, ...options };
}

export function setCursorOptions(options: CursorOptions) {
  Cursor.options = { ...Cursor.options, ...options };
}

export function resetCursor(forceThemeDefault = false) {
  Cursor.active = false;
  Cursor.hover = false;
  Cursor.canScroll = Cursor.prevCanScroll || false;
  Cursor.state = CursorState.DEFAULT;

  if (forceThemeDefault) {
    Cursor.options = {
      ...Cursor.options,
      ...{
        theme: CursorTheme.DEFAULT,
        label: "",
        hint: "",
      },
    };
  }
}
