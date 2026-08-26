'use client';
import { useState } from 'react';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loadedAt] = useState(() => Date.now());

  async function submit(formData: FormData) {
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
    const { ok } = await res.json();
    setSent(ok);
  }

  if (sent) return <p>Thanks — we’ll be in touch.</p>;
  return (
    <form action={submit}>
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} />
      <input type="hidden" name="_ft" value={loadedAt} />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button>Send</button>
    </form>
  );
}
