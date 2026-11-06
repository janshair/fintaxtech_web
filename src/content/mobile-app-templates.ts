export const mobileAppGallery = {
  title: 'Mobile apps',
  route: '/templates/mobile-apps/',
  description: 'Explore mobile app concepts and try the same customer journey on Android and iOS.',
};

export const bookingConcept = {
  title: 'Booking & appointments',
  route: mobileAppGallery.route + 'booking-appointments/',
  description:
    'Let clients choose a treatment, book a time and move their appointment from their phone.',
};

export const bookingSteps = ['Choose a treatment', 'Pick a time', 'Confirm booking', 'Reschedule'];
export const treatments = [
  { name: 'Cut & finish', details: '45 min · £45' },
  { name: 'Blow-dry', details: '30 min · £30' },
  { name: 'Restyle', details: '60 min · £60' },
];
export const bookingTimes = ['10:00', '11:30', '14:00'];
export const bookingDate = 'Saturday 14 November';
