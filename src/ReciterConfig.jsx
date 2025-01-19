const RECITER_FADE_CONFIG = {
  AbdulBasetAbdulSamad: { fadeIn: 0.3, fadeOut: 0.8 }, //good
  YasserAlDossari: { fadeIn: 0.005, fadeOut: 0.05,  },
  HaniArRifai: { fadeIn: 0.05, fadeOut: 1.00 },
  MohamedSiddiqAlMinshawi: { fadeIn: 0.25, fadeOut: 0.5 },

  // fallback if none match
  default: { fadeIn: 0.0, fadeOut: 0.0 }
};

export default RECITER_FADE_CONFIG;