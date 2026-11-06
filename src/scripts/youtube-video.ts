document.querySelectorAll<HTMLElement>('[data-youtube-video]').forEach((container) => {
  const button = container.querySelector('button');
  const template = container.querySelector('template');
  if (!button || !template) return;
  button.hidden = false;
  button.addEventListener(
    'click',
    () => {
      container.replaceChildren(template.content.cloneNode(true));
      container.querySelector('iframe')?.focus();
    },
    { once: true },
  );
});
