<template>
    <div class="primary-btn" :class="{ disabled }">
      <div class="btn-content slot">
        <slot />
      </div>
    </div>
</template> 

<script lang="ts" setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="stylus" scoped>
.primary-btn
  position relative
  text-align center
  color var(--color, currentColor)
  position relative
  background-color transparent
  border none
  outline 0
  padding rem(16)
  display flex 
  justify-content center
  align-items center
  user-select none
  text-transform uppercase
  font-weight 400
  pointer-events auto
  cursor var(--cursor-pointer)
  &::before
    content ''
    position absolute
    inset 0
    background center / contain url('@/assets/images/btn-wip.png') no-repeat

  // &:not(.icon)
  //   width rem(240)
  //   max-width 100%
  &.disabled
    opacity 0.5

  .slot
    position relative
  
  .btn-content
    width 100%
    height 100%
    position relative
    z-index 5
    color white
</style>