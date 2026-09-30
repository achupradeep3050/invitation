/* Site settings — the only file to edit for day-to-day changes. */
window.WEDDING_CONFIG = {
  // Google Apps Script web-app URL (ends in /exec). See README.md → "Connect RSVP".
  // While empty, the RSVP button is disabled and says so — nothing is saved anywhere.
  RSVP_URL: 'https://script.google.com/macros/s/AKfycbyx9h0FfvWNlOXZ9eAFhTxqcIUcq6vBkutDDhai2EIf94eYBuCoEkP1GJxVnV711uMQ/exec',

  NAMES: {
    en: { groom: 'Achu', bride: 'Lekshmi' },
    ml: { groom: 'അച്ചു', bride: 'ലക്ഷ്മി' }
  },

  // 'Watercolor' | 'Oil painting' | 'Film grade' | 'Original'
  PHOTO_STYLE: 'Watercolor',

  // The opening door animation.
  SHOW_INTRO: true
};
