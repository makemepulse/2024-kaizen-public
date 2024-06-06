/// #if DEBUG
import TextureProfiler from "./TexturesProfiler"

window.dev ||= {}
window.dev.textureUsage = TextureProfiler.report;

/// #endif
