import { track } from '../lib/analytics';
import { readPreference, writePreference } from '../lib/storage';

const sessionKey = 'ftt:project-assistant-invitation';
const dismissalPreference = 'project-assistant-dismissed-until';
const invitationDelay = 10_000;
const dismissalDuration = 7 * 24 * 60 * 60 * 1000;

function markInvitationHandled() {
  try {
    sessionStorage.setItem(sessionKey, 'handled');
  } catch {
    // Manual opening works even if browser storage is unavailable.
  }
}

function scheduleInvitation(launcher: HTMLButtonElement) {
  const invitation = document.querySelector<HTMLElement>('[data-assistant-invitation]');
  const status = document.querySelector<HTMLElement>('[data-assistant-announcement]');
  if (!invitation || !status) return;

  let started: string;
  try {
    started = sessionStorage.getItem(sessionKey) ?? String(Date.now());
    if (started === 'handled') return;
    sessionStorage.setItem(sessionKey, started);
  } catch {
    return;
  }

  const showWhenReady = () => {
    try {
      if (
        sessionStorage.getItem(sessionKey) === 'handled' ||
        Number(readPreference(dismissalPreference)) > Date.now()
      )
        return;
      if (document.hidden) {
        document.addEventListener('visibilitychange', showWhenReady, { once: true });
        return;
      }
      if (document.querySelector('dialog[open]') || document.activeElement?.closest('form')) {
        window.setTimeout(showWhenReady, 1000);
        return;
      }
      sessionStorage.setItem(sessionKey, 'handled');
    } catch {
      return;
    }
    invitation.hidden = false;
    status.textContent = status.dataset.assistantAnnouncement ?? '';
    track('project_assistant_invitation_shown');
  };

  window.setTimeout(showWhenReady, Math.max(0, invitationDelay - (Date.now() - Number(started))));
  invitation.querySelector('[data-assistant-dismiss]')?.addEventListener('click', () => {
    writePreference(dismissalPreference, String(Date.now() + dismissalDuration));
    if (invitation.contains(document.activeElement)) launcher.focus({ preventScroll: true });
    invitation.hidden = true;
    status.textContent = '';
    track('project_assistant_dismissed');
  });
  // A page restored from browser history must not show an already displayed invitation again.
  window.addEventListener('pagehide', () => {
    invitation.hidden = true;
    status.textContent = '';
  });
}

function initAssistant(dialog: HTMLDialogElement, launcher: HTMLButtonElement) {
  const screens = new Map(
    Array.from(dialog.querySelectorAll<HTMLElement>('[data-assistant-screen]'), (section) => [
      section.dataset.assistantScreen,
      section,
    ]),
  );
  const controls = dialog.querySelector<HTMLElement>('[data-assistant-controls]')!;
  const home = screens.get('home')!;
  let current = home;
  let opener = launcher;

  function selectScreen(id: string | undefined) {
    const next = screens.get(id);
    if (!next) return;
    current.hidden = true;
    current = next;
    current.hidden = false;
    controls.hidden = !current.dataset.assistantParent;
    if (dialog.open) {
      dialog.scrollTop = 0;
      current.querySelector('h3')?.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll<HTMLButtonElement>('[data-assistant-open]').forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      selectScreen('home');
      dialog.showModal();
      home.querySelector('h3')?.focus();
      markInvitationHandled();
      track('project_assistant_opened');
    });
  });
  dialog.querySelector('[data-assistant-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    (opener.closest('[hidden]') ? launcher : opener).focus();
    track('project_assistant_dismissed');
  });
  dialog.querySelector('[data-assistant-back]')?.addEventListener('click', () => {
    selectScreen(current.dataset.assistantParent);
  });
  dialog
    .querySelector('[data-assistant-restart]')
    ?.addEventListener('click', () => selectScreen('home'));
  dialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest<HTMLButtonElement>('[data-assistant-next]');
    if (option) {
      selectScreen(option.dataset.assistantNext);
      track('project_assistant_option_selected');
    }
    if (event.target.closest('a[href]')) {
      if (current.dataset.assistantScreen === 'pricing') track('project_assistant_option_selected');
      track('project_assistant_destination_clicked');
    }
  });

  launcher.hidden = false;
  scheduleInvitation(launcher);
}

const panel = document.querySelector<HTMLDialogElement>('#project-assistant');
const launcher = document.querySelector<HTMLButtonElement>('.header-cta[data-assistant-open]');
if (panel && launcher) initAssistant(panel, launcher);
