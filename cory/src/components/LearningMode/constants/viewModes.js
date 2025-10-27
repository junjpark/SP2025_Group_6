export const VIEW_MODES = {
  PIP: 'pip',
  OVERLAY: 'overlay',
  SIDE_BY_SIDE: 'sidebyside',
  FULL: 'full'
};

export const VIEW_MODE_CONFIG = {
  [VIEW_MODES.PIP]: {
    icon: '/images/pip.svg',
    title: 'Picture-in-Picture Mode'
  },
  [VIEW_MODES.OVERLAY]: {
    icon: '/images/overlay.svg',
    title: 'Overlay Mode'
  },
  [VIEW_MODES.SIDE_BY_SIDE]: {
    icon: '/images/sidebyside.svg',
    title: 'Side-by-Side Mode'
  },
  [VIEW_MODES.FULL]: {
    icon: '/images/full.svg',
    title: 'Full Screen Mode'
  }
};
