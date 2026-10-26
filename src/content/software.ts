import type { BrandName } from "../lib/icons";

/** Official demos by each software's maker, embedded with YouTube's player. Not Adhul's work. */
export interface SoftwareDemo {
  tool: string;
  brand: BrandName;
  youtubeId: string;
  title: string;
  channel: string;
  channelUrl: string;
}

export const softwareDemos: SoftwareDemo[] = [
  {
    tool: "Adobe Premiere Pro",
    brand: "premiere",
    youtubeId: "OGKbVm94uoE",
    title: "What's New in Premiere | 2026 Updates | Adobe Video",
    channel: "Adobe Video",
    channelUrl: "https://www.youtube.com/@AdobeVideo",
  },
  {
    tool: "Adobe After Effects",
    brand: "aftereffects",
    youtubeId: "WCJ73liV22U",
    title: "What's New in After Effects | 2026 Updates | Adobe Video",
    channel: "Adobe Video",
    channelUrl: "https://www.youtube.com/@AdobeVideo",
  },
  {
    tool: "DaVinci Resolve",
    brand: "resolve",
    youtubeId: "Wi44XLKQ3YA",
    title: "What's New in DaVinci Resolve 21.1",
    channel: "Blackmagic Design",
    channelUrl: "https://www.youtube.com/@BlackmagicDesignOfficial",
  },
];

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
