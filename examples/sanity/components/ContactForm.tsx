'use client';

export function ContactForm() {
  const loadedAt = Date.now();
  async function submit(formData: FormData) {
    await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
  }

  return (
    <form action={submit}>
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} />
      <input type="hidden" name="_ft" value={loadedAt} />
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button>Send</button>
    </form>
  );
}
