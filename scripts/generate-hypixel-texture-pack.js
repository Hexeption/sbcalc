#!/usr/bin/env node

/**
 * Clone/update Hypixel's official SkyBlock resource pack and package the item
 * assets used by the web app into a deterministic CATS archive.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT_DIR = join(import.meta.dirname, "..");
const CACHE_DIR = join(ROOT_DIR, "packages", "neu-recipe-processor", "output");
const REPO_DIR = join(CACHE_DIR, "hypixel-pack");
const OUTPUT_FILE = join(ROOT_DIR, "apps", "web", "public", "hypixel.cats");
const TEMP_OUTPUT_FILE = `${OUTPUT_FILE}.tmp`;

const REPO_URL = "https://github.com/meowdding/hypixel-pack.git";
const REPO_BRANCH = "26.2";
const PREFIX = "[generate-hypixel-pack]";

const CATS_MAGIC = 0x43415453;
const CATS_VERSION = 0x01;
const COMPRESSION_NONE = 0xff;
const COMPRESSION_GZIP = 0xfe;

function log(message) {
  console.log(`${PREFIX} ${message}`);
}

function runGit(args, cwd = ROOT_DIR) {
  execFileSync("git", args, { cwd, stdio: "inherit" });
}

function ensureRepo() {
  mkdirSync(CACHE_DIR, { recursive: true });

  if (existsSync(join(REPO_DIR, ".git"))) {
    log(`Updating ${REPO_BRANCH} branch...`);
    runGit(["pull", "--ff-only", "origin", REPO_BRANCH], REPO_DIR);
    return;
  }

  log(`Cloning ${REPO_BRANCH} branch...`);
  runGit([
    "clone",
    "--depth",
    "1",
    "--branch",
    REPO_BRANCH,
    REPO_URL,
    REPO_DIR,
  ]);
}

function collectFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function createDirectory() {
  return { directories: new Map(), files: new Map() };
}

function addToTree(root, sourcePath) {
  const archivePath = relative(REPO_DIR, sourcePath).split(sep);
  let directory = root;

  for (const part of archivePath.slice(0, -1)) {
    if (!directory.directories.has(part)) {
      directory.directories.set(part, createDirectory());
    }
    directory = directory.directories.get(part);
  }

  directory.files.set(archivePath.at(-1), sourcePath);
}

function byteLength(value) {
  return Buffer.byteLength(value, "ascii");
}

function entryHeaderSize(name) {
  return 1 + 1 + byteLength(name);
}

function directoryHeaderSize(directory, name = null) {
  let size = (name === null ? 0 : entryHeaderSize(name)) + 2;

  for (const [childName, child] of directory.directories) {
    size += directoryHeaderSize(child, childName);
  }
  for (const fileName of directory.files.keys()) {
    size += entryHeaderSize(fileName) + 4 + 4 + 1;
  }

  return size;
}

function writeName(buffer, offset, name) {
  const length = byteLength(name);
  if (length > 255) {
    throw new Error(`CATS entry name is too long: ${name}`);
  }
  buffer.writeUInt8(length, offset);
  buffer.write(name, offset + 1, length, "ascii");
  return offset + 1 + length;
}

function prepareFiles(directory, state) {
  for (const child of directory.directories.values()) {
    prepareFiles(child, state);
  }

  for (const sourcePath of directory.files.values()) {
    const raw = readFileSync(sourcePath);
    const gzip = gzipSync(raw, { level: 9 });
    const compressed = gzip.length < raw.length;
    const data = compressed ? gzip : raw;

    state.files.set(sourcePath, {
      offset: state.dataSize,
      data,
      compression: compressed ? COMPRESSION_GZIP : COMPRESSION_NONE,
    });
    state.dataSize += data.length;
  }
}

function writeDirectoryHeader(
  buffer,
  offset,
  directory,
  prepared,
  name = null,
) {
  if (name !== null) {
    buffer.writeUInt8(0x01, offset++);
    offset = writeName(buffer, offset, name);
  }

  const childCount = directory.directories.size + directory.files.size;
  if (childCount > 65_535) {
    throw new Error("CATS directory contains too many entries");
  }
  buffer.writeUInt16BE(childCount, offset);
  offset += 2;

  for (const [childName, child] of directory.directories) {
    offset = writeDirectoryHeader(buffer, offset, child, prepared, childName);
  }

  for (const [fileName, sourcePath] of directory.files) {
    const file = prepared.files.get(sourcePath);
    buffer.writeUInt8(0x00, offset++);
    offset = writeName(buffer, offset, fileName);
    buffer.writeInt32BE(file.offset, offset);
    offset += 4;
    buffer.writeInt32BE(file.data.length, offset);
    offset += 4;
    buffer.writeUInt8(file.compression, offset++);
  }

  return offset;
}

function createArchive() {
  const assetDirectories = [
    join(REPO_DIR, "assets", "hypixel_skyblock", "items"),
    join(REPO_DIR, "assets", "hypixel_skyblock", "models"),
    join(REPO_DIR, "assets", "hypixel_skyblock", "textures", "item"),
  ];
  const sourceFiles = assetDirectories
    .flatMap(collectFiles)
    .filter((path) => /\.(json|mcmeta|png)$/i.test(path))
    .sort();

  if (sourceFiles.length === 0) {
    throw new Error("No Hypixel item assets were found");
  }

  const tree = createDirectory();
  for (const sourcePath of sourceFiles) addToTree(tree, sourcePath);

  const prepared = { files: new Map(), dataSize: 0 };
  prepareFiles(tree, prepared);

  const headerSize = 4 + 1 + directoryHeaderSize(tree);
  const header = Buffer.alloc(headerSize);
  header.writeUInt32BE(CATS_MAGIC, 0);
  header.writeUInt8(CATS_VERSION, 4);
  const finalOffset = writeDirectoryHeader(header, 5, tree, prepared);
  if (finalOffset !== headerSize) {
    throw new Error("CATS header size mismatch");
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  const data = Array.from(prepared.files.values(), (file) => file.data);
  writeFileSync(TEMP_OUTPUT_FILE, Buffer.concat([header, ...data]));
  renameSync(TEMP_OUTPUT_FILE, OUTPUT_FILE);

  const sizeMiB = (statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  log(`Wrote ${sourceFiles.length} files to ${OUTPUT_FILE} (${sizeMiB} MiB)`);
}

ensureRepo();
createArchive();
