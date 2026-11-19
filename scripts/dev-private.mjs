import { spawn } from "node:child_process";

// Local-only preview of private videos. Never used by `vite build`.
const child = spawn(["npx vite", ...process.argv.slice(2)].join(" "), {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, PREVIEW_PRIVATE_MEDIA: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
