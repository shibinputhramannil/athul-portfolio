#!/usr/bin/env node
// Encodes local source videos into web files under public/media/<id>/.
// Inputs come from media.local.json (git-ignored); outputs are git-ignored too.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const configPath = "media.local.json";
if (!existsSync(configPath)) {
  console.error(
    `Missing ${configPath}. Copy media.local.example.json and edit the paths.`,
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const outRoot = join("public", "media");
const manifestPath = join(outRoot, "manifest.json");
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${cmd} failed (${result.status})`);
  return result.stdout;
}

for (const [id, entry] of Object.entries(config)) {
  const { src, previewStart } =
    typeof entry === "string" ? { src: entry } : entry;
  if (!existsSync(src)) {
    console.error(`[${id}] source not found: ${src}`);
    continue;
  }
  const out = join(outRoot, id);
  mkdirSync(out, { recursive: true });

  const duration = Number(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      src,
    ]).trim(),
  );
  const start =
    previewStart ?? Math.max(0, Math.min(duration * 0.1, duration - 6));
  const fit =
    "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";

  console.log(`[${id}] full.mp4`);
  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    src,
    "-vf",
    fit,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-maxrate",
    "4M",
    "-bufsize",
    "8M",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    join(out, "full.mp4"),
  ]);

  console.log(`[${id}] preview.mp4 (silent, 6 s)`);
  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-ss",
    String(start),
    "-t",
    "6",
    "-i",
    src,
    "-an",
    "-vf",
    `${fit},scale=540:960`,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    join(out, "preview.mp4"),
  ]);

  console.log(`[${id}] poster.jpg`);
  run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-ss",
    String(start),
    "-i",
    src,
    "-frames:v",
    "1",
    "-vf",
    `${fit},scale=720:1280`,
    "-q:v",
    "3",
    join(out, "poster.jpg"),
  ]);

  manifest[id] = { durationSec: Math.round(duration * 10) / 10 };
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifestPath}`);
