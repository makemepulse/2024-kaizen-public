<template>
  <footer class="outro-footer">
    <span class="footer-logo">makemepulse©</span>
    <ul class="footer-socials">
      <li v-for="(social, index) in socials" :key="social">
        <a :href="t(`socials.social_${index+1}.url`)" target="_blank" rel="noopener noreferrer">
          <svg-icon :name="`socials/${t(`socials.social_${index+1}.name`)}`" />
        </a>
      </li>
    </ul>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, messages, locale } = useI18n();
const socials = computed(() => Object.keys(messages.value[locale.value].socials))
</script>

<style lang="stylus" scoped>
.outro-footer
  position fixed
  bottom rem(20)
  left rem(20)
  display flex
  justify-content space-between
  width calc(100% - 40px)
  z-index 10

  .footer-socials
    display flex
    gap rem(16)

    .icon
      width rem(24)
      height @width

  .footer-logo
    display block
    font-size rem(20)
    line-height 1
</style>