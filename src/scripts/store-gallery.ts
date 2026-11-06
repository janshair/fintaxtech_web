const gallery = document.querySelector<HTMLElement>('#store-gallery');
const controls = document.querySelector<HTMLElement>('.gallery-controls');
if (gallery && controls) {
  const buttons = controls.querySelectorAll<HTMLButtonElement>('button');
  const sync = () => {
    buttons[0].disabled = gallery.scrollLeft <= 1;
    buttons[1].disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 1;
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const step =
        gallery.children[1].getBoundingClientRect().left -
        gallery.children[0].getBoundingClientRect().left;
      gallery.scrollBy({
        left: Number(button.dataset.direction) * step,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
  }
  controls.hidden = false;
  gallery.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(gallery);
  sync();
}
