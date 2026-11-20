import { lazy } from "react";
import { MaskDemo, ReframeDemo, RotoDemo } from "./ToolAI";

// The first topic of each tool ships with the page; the other twelve
// scenes load as their own chunk when the toolkit nears the screen.
const loaders = {
  premiere: () => import("./scenes/premiere"),
  aftereffects: () => import("./scenes/aftereffects"),
  resolve: () => import("./scenes/resolve"),
};
const later = (brand, name) =>
  lazy(() => loaders[brand]().then((m) => ({ default: m[name] })));
let preloaded = false;
export function preloadScenes() {
  if (preloaded) return;
  preloaded = true;
  Object.values(loaders).forEach((load) => load().catch(() => {}));
}

const SceneDetectScene = later("premiere", "SceneDetectScene");
const SpeechTextScene = later("premiere", "SpeechTextScene");
const EnhanceSpeechScene = later("premiere", "EnhanceSpeechScene");
const GenExtendScene = later("premiere", "GenExtendScene");
const ContentFillScene = later("aftereffects", "ContentFillScene");
const CameraTrackScene = later("aftereffects", "CameraTrackScene");
const GraphEditorScene = later("aftereffects", "GraphEditorScene");
const ExpressionScene = later("aftereffects", "ExpressionScene");
const SpeedWarpScene = later("resolve", "SpeedWarpScene");
const DepthMapScene = later("resolve", "DepthMapScene");
const FaceRefineScene = later("resolve", "FaceRefineScene");
const SuperScaleScene = later("resolve", "SuperScaleScene");

/**
 * Each tool's explainer: five important topics, 10 s each. Captions and
 * `beats` follow the three beats of every scene (find, process, result);
 * `kind` marks AI features apart from core techniques, `algo` names how it
 * works and `engine` what runs it.
 * These describe the software in general, not any specific project.
 */
export const programs = {
  premiere: {
    verb: "Cut",
    use: "Editing & assembly",
    desc: "Where the story is cut: assembly, pacing, dialogue and delivery.",
    topics: [
      {
        title: "Auto Reframe",
        engine: "Adobe Sensei",
        beats: ["Detect", "Track", "Reframe"],
        kind: "AI",
        algo: "Subject detection + tracking",
        desc: "Keeps the subject in frame for vertical and square cuts.",
        captions: [
          "The AI scans every frame and finds the subject.",
          "It tracks him as he moves, frame by frame.",
          "Then reframes the wide shot into a vertical 9:16 cut.",
        ],
        result: "Vertical cut ready",
        Scene: ReframeDemo,
      },
      {
        title: "Scene Edit Detection",
        engine: "Adobe Sensei",
        beats: ["Read", "Compare", "Cut"],
        kind: "AI",
        algo: "Frame-difference analysis",
        desc: "Finds every cut in a flattened video and splits it into clips.",
        captions: [
          "One flattened export, with every cut hidden inside.",
          "It compares each frame with the last; spikes are cuts.",
          "An edit point lands on every cut, ready to re-edit.",
        ],
        result: "4 cuts found",
        Scene: SceneDetectScene,
      },
      {
        title: "Speech to Text",
        engine: "Adobe Sensei",
        beats: ["Listen", "Transcribe", "Caption"],
        kind: "AI",
        algo: "Speech recognition",
        desc: "Transcribes dialogue and turns it into timed captions.",
        captions: [
          "It listens to the dialogue track.",
          "Speech becomes a timed transcript, word by word.",
          "One click turns the transcript into captions.",
        ],
        result: "Captions created",
        Scene: SpeechTextScene,
      },
      {
        title: "Enhance Speech",
        engine: "Adobe AI",
        beats: ["Analyse", "Separate", "Clean"],
        kind: "AI",
        algo: "Neural voice separation",
        desc: "Cleans noisy dialogue so it sounds studio recorded.",
        captions: [
          "Dialogue recorded next to a busy street.",
          "The AI pulls the voice apart from the noise.",
          "What's left sounds like a studio recording.",
        ],
        result: "Noise removed",
        Scene: EnhanceSpeechScene,
      },
      {
        title: "Generative Extend",
        engine: "Adobe Firefly",
        beats: ["Measure", "Generate", "Extend"],
        kind: "AI",
        algo: "Generative video model",
        desc: "Generates extra frames when a clip is a little too short.",
        captions: [
          "The clip ends before the music does.",
          "Generative AI creates the frames that were never shot.",
          "The shot now holds right up to the beat.",
        ],
        result: "+2 s generated",
        Scene: GenExtendScene,
      },
    ],
  },
  aftereffects: {
    verb: "Animate",
    use: "Motion graphics & VFX",
    desc: "Where motion is built: titles, tracking, compositing and effects.",
    topics: [
      {
        title: "Roto Brush",
        engine: "Adobe Sensei",
        beats: ["Paint", "Propagate", "Composite"],
        kind: "AI",
        algo: "Segmentation + edge propagation",
        desc: "Cuts the subject out of the background on every frame.",
        captions: [
          "One brush stroke tells the AI what to keep.",
          "It traces her edge and follows it through every frame.",
          "Now the title can sit behind her.",
        ],
        result: "Title behind subject",
        Scene: RotoDemo,
      },
      {
        title: "Content-Aware Fill",
        engine: "Adobe Sensei",
        beats: ["Mask", "Sample", "Fill"],
        kind: "AI",
        algo: "Patch fill from nearby frames",
        desc: "Removes unwanted objects and rebuilds what was behind them.",
        captions: [
          "A road sign spoils the shot, so mask it out.",
          "The AI borrows pixels from nearby frames to fill it.",
          "The sign is gone, on every frame.",
        ],
        result: "Object removed",
        Scene: ContentFillScene,
      },
      {
        title: "3D Camera Tracker",
        engine: "Computer vision",
        beats: ["Track", "Solve", "Place"],
        kind: "Tracking",
        algo: "Feature tracking + camera solve",
        desc: "Solves the camera move so graphics stick to the scene.",
        captions: [
          "It tracks hundreds of points through the shot.",
          "From them it solves the camera and the ground.",
          "3D text placed on the ground moves with the shot.",
        ],
        result: "Camera solved",
        Scene: CameraTrackScene,
      },
      {
        title: "Graph Editor",
        engine: "Bezier maths",
        beats: ["Keyframe", "Ease", "Settle"],
        kind: "Motion",
        algo: "Bezier speed curves",
        desc: "Shapes the speed curve so motion eases in and out.",
        captions: [
          "Two keyframes: the move is linear and robotic.",
          "Easy Ease bends the speed graph into a curve.",
          "Now it speeds up and settles, like real motion.",
        ],
        result: "Motion eased",
        Scene: GraphEditorScene,
      },
      {
        title: "Expressions",
        engine: "JavaScript engine",
        beats: ["Type", "Wiggle", "Link"],
        kind: "Code",
        algo: "JavaScript expressions",
        desc: "A line of code drives the animation instead of keyframes.",
        captions: [
          "One line of code on the Position property.",
          "wiggle(2, 30) adds organic, random motion.",
          "Pick-whip it and other layers follow along.",
        ],
        result: "Animated with code",
        Scene: ExpressionScene,
      },
    ],
  },
  resolve: {
    verb: "Grade",
    use: "Colour grading & finishing",
    desc: "Where the look is finished: colour, masks, retiming and detail.",
    topics: [
      {
        title: "Magic Mask",
        engine: "DaVinci Neural Engine",
        beats: ["Stroke", "Mask", "Grade"],
        kind: "AI",
        algo: "Neural Engine segmentation",
        desc: "Masks a person from one stroke for separate grades.",
        captions: [
          "One stroke on the person is all it needs.",
          "The Neural Engine finds and masks them.",
          "Then subject and background are graded separately.",
        ],
        result: "Graded in two looks",
        Scene: MaskDemo,
      },
      {
        title: "Speed Warp",
        engine: "DaVinci Neural Engine",
        beats: ["Retime", "Flow", "Interpolate"],
        kind: "AI",
        algo: "Neural optical flow",
        desc: "Creates smooth slow motion from normal-speed footage.",
        captions: [
          "Slowed down, 24 fps footage stutters.",
          "The Neural Engine maps motion between frames.",
          "New in-between frames make it silky smooth.",
        ],
        result: "4× slow motion",
        Scene: SpeedWarpScene,
      },
      {
        title: "Depth Map",
        engine: "DaVinci Neural Engine",
        beats: ["Analyse", "Estimate", "Defocus"],
        kind: "AI",
        algo: "Monocular depth estimation",
        desc: "Turns a flat shot into a depth matte for blur and grading.",
        captions: [
          "A flat 2D shot: subject, trees and mountains.",
          "The AI estimates how far away every pixel is.",
          "Now the background can be blurred by depth.",
        ],
        result: "Depth of field added",
        Scene: DepthMapScene,
      },
      {
        title: "Face Refinement",
        engine: "DaVinci Neural Engine",
        beats: ["Detect", "Map", "Refine"],
        kind: "AI",
        algo: "Facial landmark tracking",
        desc: "Tracks a face to refine skin, eyes and lips.",
        captions: [
          "It finds the face and tracks it through the shot.",
          "Landmarks map the eyes, brows and lips.",
          "Skin smooths and eyes brighten, only on the face.",
        ],
        result: "Face refined",
        Scene: FaceRefineScene,
      },
      {
        title: "Super Scale",
        engine: "DaVinci Neural Engine",
        beats: ["Analyse", "Rebuild", "Upscale"],
        kind: "AI",
        algo: "Neural super-resolution",
        desc: "Upscales footage with rebuilt, sharp detail.",
        captions: [
          "Low-resolution footage looks soft and blocky.",
          "The Neural Engine rebuilds detail as it scales up.",
          "A sharp 4K frame from an HD source.",
        ],
        result: "Upscaled to 4K",
        Scene: SuperScaleScene,
      },
    ],
  },
};
