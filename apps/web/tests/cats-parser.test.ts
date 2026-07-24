import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractFile,
  extractFileAsText,
  listFiles,
  listFilesInDir,
  parseCats,
} from "@/lib/cats-parser";

const PACK_PATH = resolve(import.meta.dirname, "../public/hypixel.cats");

function loadPack(): ArrayBuffer {
  const buf = readFileSync(PACK_PATH);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("CATS parser", () => {
  it("parses the magic number and version", () => {
    const archive = parseCats(loadPack());
    expect(archive).toBeDefined();
    expect(archive.headerSize).toBeGreaterThan(5);
  });

  it("finds files in the archive", () => {
    const archive = parseCats(loadPack());
    const files = listFiles(archive);
    expect(files.length).toBeGreaterThan(0);
  });

  it("file paths start with /", () => {
    const archive = parseCats(loadPack());
    const files = listFiles(archive);
    for (const f of files) {
      expect(f.startsWith("/")).toBe(true);
    }
  });

  it("lists files in a subdirectory", () => {
    const archive = parseCats(loadPack());
    const allFiles = listFiles(archive);
    // Find a directory that exists
    const firstFile = allFiles[0]!;
    const dir = firstFile.substring(0, firstFile.lastIndexOf("/") + 1);
    const dirFiles = listFilesInDir(archive, dir);
    expect(dirFiles.length).toBeGreaterThan(0);
    for (const f of dirFiles) {
      expect(f.startsWith(dir)).toBe(true);
    }
  });

  it("extracts a PNG file", async () => {
    const archive = parseCats(loadPack());
    const files = listFiles(archive);
    const png = files.find((f) => f.endsWith(".png"));
    expect(png).toBeDefined();

    const bytes = await extractFile(archive, png!);
    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBeGreaterThan(0);
    // PNG magic: 0x89504E47
    expect(bytes![0]).toBe(0x89);
    expect(bytes![1]).toBe(0x50);
    expect(bytes![2]).toBe(0x4e);
    expect(bytes![3]).toBe(0x47);
  });

  it("extracts a JSON file as text", async () => {
    const archive = parseCats(loadPack());
    const files = listFiles(archive);
    const json = files.find((f) => f.endsWith(".json"));
    expect(json).toBeDefined();

    const text = await extractFileAsText(archive, json!);
    expect(text).not.toBeNull();
    // Should be valid JSON
    const parsed = JSON.parse(text!);
    expect(parsed).toBeDefined();
  });

  it("returns null for non-existent files", async () => {
    const archive = parseCats(loadPack());
    const bytes = await extractFile(archive, "/nonexistent.txt");
    expect(bytes).toBeNull();
  });

  it("rejects invalid magic number", () => {
    const buf = new ArrayBuffer(16);
    const view = new DataView(buf);
    view.setUint32(0, 0xdeadbeef);
    expect(() => parseCats(buf)).toThrow("Invalid CATS magic");
  });

  it("rejects unsupported version", () => {
    const buf = new ArrayBuffer(16);
    const view = new DataView(buf);
    view.setUint32(0, 0x43415453); // CATS
    view.setUint8(4, 0x99); // bad version
    expect(() => parseCats(buf)).toThrow("Unsupported CATS version");
  });

  it("logs sample file paths for inspection", () => {
    const archive = parseCats(loadPack());
    const files = listFiles(archive);
    console.log(`Total files: ${files.length}`);
    console.log("Sample paths:", files.slice(0, 20));
  });
});
