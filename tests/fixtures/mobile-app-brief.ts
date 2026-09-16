import { emptyBrief } from '../../src/lib/client-brief/rules';

export function completeMobileBrief(redesign = false) {
  const state = emptyBrief();
  state.answers = {
    project: redesign ? 'Complete redesign' : 'New app',
    ...(redesign
      ? { appLinks: 'https://apps.apple.com/example\nhttps://play.google.com/example' }
      : {}),
    users: ['Existing customers'],
    tasks: ['Book', 'Track progress'],
    devices: 'Both',
    tablets: 'Tablets too',
    frequency: 'Weekly',
    features: ['Accounts/login', 'Booking', 'Other'],
    essentialFeatures: ['Booking'],
    offline: 'Record work and sync later',
    information: ['Health or other sensitive information'],
    systems: 'Yes',
    content: 'Customer provides all final content',
    assets: ['None'],
    appleAccount: 'No',
    googleAccount: 'Not sure',
    success: ['Bookings/orders', 'Time saved'],
    deadline: 'Yes',
    deadlineDate: '2026-12-31',
    deadlineReason: 'Business launch',
    anything: 'Make the core journey clear and accessible.',
  };
  state.rows.customFeatures = [
    {
      id: '1',
      values: {
        name: 'Appointment reminder rules',
        purpose: 'Let customers choose reminder intervals.',
        release: 'Later',
      },
    },
  ];
  state.rows.systemDetails = [
    { id: '1', values: { name: 'Scheduling system', purpose: 'Read available appointments.' } },
  ];
  return state;
}
