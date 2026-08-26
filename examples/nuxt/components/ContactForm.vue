<script setup>
const loadedAt = Date.now();
const sent = ref(false);

async function submit(e) {
  const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
    method: 'POST',
    body: new FormData(e.target),
  });
  sent.value = (await res.json()).ok;
}
</script>

<template>
  <p v-if="sent">Thanks — we’ll be in touch.</p>
  <form v-else @submit.prevent="submit">
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" :value="loadedAt" />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>Send</button>
  </form>
</template>
