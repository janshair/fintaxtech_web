(() => {
  'use strict';
  // Ported from the approved Copperwell template: drops, chips, photo, quote demo,
  // reminder demo and scroll reveals. Personalisation lives in identity.js.
  window.plumbingIdentity?.hydrate();
  window.plumbingIdentity?.stop();
  // The final offer opens the template brief with this preview's values.
  const identity = window.plumbingIdentity?.values || {};
  const brief = new URL('/client/website-brief/templates/?template=plumbing-10', location.origin);
  if (identity.name) brief.searchParams.set('name', identity.name);
  if (identity.area) brief.searchParams.set('area', identity.area);
  if (identity.phone) brief.searchParams.set('phone', identity.phone.display);
  if (identity.ref) brief.searchParams.set('ref', identity.ref);
  document.querySelectorAll('[data-brief-link]').forEach((node) => {
    node.href = brief.pathname + brief.search;
  });
  if (identity.ref) {
    const contact = new URL('/contact/', location.origin);
    contact.searchParams.set('ref', identity.ref);
    document.querySelectorAll('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // falling drops
  const drops = document.querySelector('.drops');
  if (drops && !reduced) {
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDuration = 4 + Math.random() * 5 + 's';
      s.style.animationDelay = -Math.random() * 8 + 's';
      s.style.transform = 'scale(' + (0.6 + Math.random() * 0.9) + ')';
      drops.appendChild(s);
    }
  }
  // chips
  document.querySelectorAll('.chips').forEach((group) => {
    group.addEventListener('click', (event) => {
      if (event.target.classList.contains('chip')) {
        group.querySelectorAll('.chip').forEach((chip) => {
          chip.classList.remove('on');
          chip.setAttribute('aria-pressed', 'false');
        });
        event.target.classList.add('on');
        event.target.setAttribute('aria-pressed', 'true');
      }
    });
  });
  const photo = document.querySelector('.photo');
  if (photo) {
    const add = () => (photo.textContent = '✓ photo-of-boiler.jpg added (demo)');
    photo.addEventListener('click', add);
    photo.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        add();
      }
    });
  }
  // quote demo: nothing is sent
  const form = document.getElementById('qf');
  const done = document.getElementById('qdone');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.style.display = 'none';
    done.style.display = 'block';
  });
  document.getElementById('qagain').addEventListener('click', () => {
    done.style.display = 'none';
    form.style.display = 'block';
  });
  // reminder demo: nothing is sent
  const remind = document.getElementById('remind-form');
  remind?.addEventListener('submit', (event) => {
    event.preventDefault();
    remind.innerHTML = '<b>✓ Demo: reminder set.</b>';
  });
  // reveal
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
              }
            }),
          { threshold: 0.12 },
        )
      : null;
  document
    .querySelectorAll('.reveal')
    .forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
})();
