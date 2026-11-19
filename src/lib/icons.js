/** Stroke icons on a 24px grid, 1.6px stroke, round caps. Drawn for this site. */
export const uiIcons = {
  "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  volume:
    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  "volume-off":
    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 7l8 6 8-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5"/><path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  work: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 8.5h17M3.5 15.5h17M8 4.5v4M12 4.5v4M16 4.5v4M8 15.5v4M12 15.5v4M16 15.5v4"/>',
  about:
    '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  experience:
    '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8M11 6h9M11 18h6"/>',
  contact: '<path d="M4 5.5h16v10.5H9.5L4 20z"/><path d="M8 10.5h8"/>',
  keyframe: '<path d="M12 4l8 8-8 8-8-8z"/>',
  craft:
    '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  rewind: '<path d="M11 18.5 4 12l7-6.5zM20 18.5 13 12l7-6.5z"/>',
  "arrow-down": '<path d="M12 5v14M6 13l6 6 6-6"/>',
  spark:
    '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2"/>',
  "chevron-left": '<path d="M15 5l-7 7 7 7"/>',
  "chevron-right": '<path d="M9 5l7 7-7 7"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  send: '<path d="M4 12 20 4l-5 16-3-7z"/><path d="M12 13l8-9"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  forward: '<path d="M13 18.5 20 12l-7-6.5zM4 18.5 11 12 4 5.5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v6h14v-6"/>',
  enter: '<path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
};

/** CV tool names mapped to brand icons and their full product names. */
export const toolMeta = {
  "Premiere Pro": { brand: "premiere", name: "Adobe Premiere Pro" },
  "After Effects": { brand: "aftereffects", name: "Adobe After Effects" },
  "DaVinci Resolve": { brand: "resolve", name: "DaVinci Resolve" },
};
