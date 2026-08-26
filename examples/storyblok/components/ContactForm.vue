<script setup>
const loadedAt = Date.now();
defineProps({ blok: Object });
</script>

<template>
  <form v-editable="blok" action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" :value="loadedAt" />
    <input name="name" type="text" required />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>{{ blok.button_label }}</button>
  </form>
</template>
