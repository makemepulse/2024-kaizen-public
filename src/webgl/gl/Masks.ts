
/**
 * Enum for render pass
 */
//TODO: rename to Mask
enum Masks {
  SPRITE        = -1,
  OPAQUE        = 1<<0,
  BLENDED       = 1<<1,
  RING_BACK       = 1<<2,
  
  SHADOW_CASTER = 1<<10,

  REFLECTED_DEPTH     = 1<<11,
  REFLECTED_COLOR     = 1<<12,
  REFLECTED_BLENDED     = 1<<13,
  REFLECTED           = REFLECTED_DEPTH | REFLECTED_COLOR,

}

export default Masks;