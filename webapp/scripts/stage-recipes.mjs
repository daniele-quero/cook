import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sourceDirectory = fileURLToPath(new URL("../../recipes/", import.meta.url));
const destinationDirectory = fileURLToPath(new URL("../recipes/", import.meta.url));

if (!existsSync(sourceDirectory)) {
  throw new Error(`Directory recipes non trovata: ${sourceDirectory}`);
}

rmSync(destinationDirectory, { force: true, recursive: true });
cpSync(sourceDirectory, destinationDirectory, { recursive: true });