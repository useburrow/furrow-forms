<script>
  const loadedAt = Date.now();
  let sent = false;

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: new FormData(e.target),
    });
    sent = (await res.json()).ok;
  }
</script>

{#if sent}
  <p>Thanks — we’ll be in touch.</p>
{:else}
  <form method="POST" action="https://api.furrowforms.com/s/fp_k7m2" on:submit={submit}>
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" value={loadedAt} />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>Send</button>
  </form>
{/if}
