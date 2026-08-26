export default function ContactForm({ slice }) {
  const loadedAt = Date.now();
  return (
    <form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} />
      <input type="hidden" name="_ft" value={loadedAt} />
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button>{slice.primary.button_label}</button>
    </form>
  );
}
