#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import OSS from 'ali-oss';
import dotenv from 'dotenv';
import { imageSize } from 'image-size';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DEFAULT_ASSETS_DIR = path.join(ROOT_DIR, 'miniprogram/assets/images');
const DEFAULT_MANIFEST_PATH = path.join(ROOT_DIR, 'miniprogram/assets/oss-images.json');

loadEnv();

const config = readConfig();
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command || ['-h', '--help', 'help'].includes(command)) {
  printHelp();
  process.exit(0);
}

try {
  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (command === 'upload') {
    await uploadAssets(args);
  } else if (command === 'url') {
    await printAssetUrl(args);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(ROOT_DIR, file);
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false, quiet: true });
    }
  }
}

function readConfig() {
  const bucket = process.env.OSS_BUCKET || process.env.OSS_BUCKET_NAME;
  const region = process.env.OSS_REGION || 'oss-cn-hangzhou';
  const accessKeyId = process.env.OSS_AK || process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_SK || process.env.OSS_ACCESS_KEY_SECRET;
  const endpoint = process.env.OSS_ENDPOINT || undefined;
  const prefix = normalizePrefix(process.env.OSS_ASSETS_PREFIX || 'assets/images/');
  const publicBaseUrl = stripTrailingSlash(
    process.env.OSS_PUBLIC_BASE_URL ||
      (endpoint
        ? `https://${bucket}.${endpoint.replace(/^https?:\/\//, '')}`
        : `https://${bucket}.${region}.aliyuncs.com`),
  );

  return {
    bucket,
    region,
    accessKeyId,
    accessKeySecret,
    endpoint,
    prefix,
    publicBaseUrl,
  };
}

async function uploadAssets(argv) {
  assertUploadConfig();

  const options = parseOptions(argv);
  const assetsDir = path.resolve(ROOT_DIR, options.dir || DEFAULT_ASSETS_DIR);
  const manifestPath = path.resolve(ROOT_DIR, options.manifest || DEFAULT_MANIFEST_PATH);
  const files = await listImageFiles(assetsDir);

  if (files.length === 0) {
    throw new Error(`No image files found in ${path.relative(ROOT_DIR, assetsDir)}`);
  }

  const client = new OSS({
    region: config.region,
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    secure: true,
  });

  const images = {};
  for (const filePath of files) {
    const filename = path.basename(filePath);
    const objectKey = `${config.prefix}${filename}`;
    const contentType = mime.lookup(filename) || 'application/octet-stream';
    const dimensions = readImageDimensions(filePath);
    const stat = await fs.stat(filePath);

    await client.put(objectKey, filePath, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    const url = `${config.publicBaseUrl}/${encodeObjectKey(objectKey)}`;
    images[filename] = {
      filename,
      objectKey,
      url,
      contentType,
      size: stat.size,
      width: dimensions.width,
      height: dimensions.height,
      type: dimensions.type,
      retinaUrl:
        dimensions.width && dimensions.height
          ? buildResizeUrl(url, {
              width: Math.ceil(dimensions.width / 2),
              height: Math.ceil(dimensions.height / 2),
              type: dimensions.type,
            })
          : url,
    };

    console.log(`uploaded ${filename} -> ${objectKey}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: config.bucket,
    region: config.region,
    prefix: config.prefix,
    publicBaseUrl: config.publicBaseUrl,
    images,
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`manifest written: ${path.relative(ROOT_DIR, manifestPath)}`);
  console.log(`uploaded ${files.length} assets`);
}

async function printAssetUrl(argv) {
  const options = parseOptions(argv);
  const assetName = options._[0];

  if (!assetName) {
    throw new Error('Missing asset name. Example: pnpm oss:image-url -- hero-banner-songyang.png --width 180 --height 120');
  }

  const manifestPath = path.resolve(ROOT_DIR, options.manifest || DEFAULT_MANIFEST_PATH);
  const image = existsSync(manifestPath)
    ? findImage(JSON.parse(await fs.readFile(manifestPath, 'utf8')).images, assetName)
    : buildImageFromConfig(assetName);

  if (!image) {
    throw new Error(`Asset not found in manifest: ${assetName}`);
  }

  const width = numberOption(options.width || options.w);
  const height = numberOption(options.height || options.h);

  if (!width && !height) {
    console.log(image.url);
    return;
  }

  console.log(
    buildResizeUrl(image.url, {
      width,
      height,
      type: image.type,
      mode: options.mode || 'lfit',
    }),
  );
}

async function listImageFiles(assetsDir) {
  const entries = await fs.readdir(assetsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isSupportedImage(entry.name))
    .map((entry) => path.join(assetsDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function isSupportedImage(filename) {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(filename);
}

function readImageDimensions(filePath) {
  try {
    const result = imageSize(readFileSync(filePath));
    return {
      width: result.width || null,
      height: result.height || null,
      type: result.type || path.extname(filePath).slice(1).toLowerCase(),
    };
  } catch {
    return {
      width: null,
      height: null,
      type: path.extname(filePath).slice(1).toLowerCase(),
    };
  }
}

function buildResizeUrl(url, options) {
  if (options.type === 'svg') {
    return url;
  }

  const params = ['image/resize', `m_${options.mode || 'lfit'}`];
  if (options.width) {
    params.push(`w_${Math.ceil(options.width * 2)}`);
  }
  if (options.height) {
    params.push(`h_${Math.ceil(options.height * 2)}`);
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}x-oss-process=${params.join(',')}`;
}

function parseOptions(argv) {
  const options = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (!arg.startsWith('--')) {
      options._.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = inlineValue ?? argv[index + 1];
    options[key] = value;

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return options;
}

function numberOption(value) {
  if (value === undefined) {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid size: ${value}`);
  }
  return number;
}

function findImage(images, assetName) {
  return images[assetName] || images[path.basename(assetName)];
}

function buildImageFromConfig(assetName) {
  const filename = path.basename(assetName);
  const objectKey = `${config.prefix}${filename}`;
  return {
    filename,
    objectKey,
    url: `${config.publicBaseUrl}/${encodeObjectKey(objectKey)}`,
    type: path.extname(filename).slice(1).toLowerCase(),
  };
}

function normalizePrefix(prefix) {
  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/');
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function encodeObjectKey(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function assertUploadConfig() {
  const missing = [];
  for (const [key, value] of Object.entries({
    OSS_BUCKET: config.bucket,
    OSS_AK: config.accessKeyId,
    OSS_SK: config.accessKeySecret,
  })) {
    if (!value) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing OSS env: ${missing.join(', ')}. Copy .env.example to .env.local and fill the values.`);
  }
}

function printHelp() {
  console.log(`Usage:
  pnpm upload:assets
  pnpm oss:image-url -- <asset-name> --width <element-width> [--height <element-height>]

Environment:
  OSS_BUCKET             OSS bucket name, default configured in .env.example
  OSS_REGION             OSS region, defaults to oss-cn-hangzhou
  OSS_AK                 AccessKey ID
  OSS_SK                 AccessKey secret
  OSS_ASSETS_PREFIX      Object key prefix, defaults to assets/images/
  OSS_PUBLIC_BASE_URL    Optional CDN or custom public domain

Examples:
  pnpm upload:assets
  pnpm oss:image-url -- hero-banner-songyang.png --width 180 --height 120
`);
}
