import { createHash, randomUUID } from 'crypto';
import { Readable } from 'stream';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync, createReadStream, readdirSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

import {
  canAccessObject,
  getObjectAclPolicy,
  ObjectAclPolicy,
  ObjectPermission,
  setObjectAclPolicy,
} from './objectAcl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCAL_STORAGE_ROOT = process.env.LOCAL_OBJECT_STORAGE_ROOT || resolve(__dirname, '..', '..', '..', '..', 'local-storage');
const PUBLIC_OBJECT_SEARCH_PATHS = process.env.PUBLIC_OBJECT_SEARCH_PATHS || join(LOCAL_STORAGE_ROOT, 'public');
const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || join(LOCAL_STORAGE_ROOT, 'private');

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function getMetadataPath(filePath: string): string {
  return `${filePath}.meta.json`;
}

function readMetadata(filePath: string): Record<string, string> | null {
  const metaPath = getMetadataPath(filePath);
  if (!existsSync(metaPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeMetadata(filePath: string, metadata: Record<string, string>): void {
  const metaPath = getMetadataPath(filePath);
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
}

class LocalFile {
  constructor(
    public readonly name: string,
    public readonly bucketName: string,
    private readonly fullPath: string,
  ) {}

  async exists(): Promise<[boolean]> {
    return [existsSync(this.fullPath)];
  }

  async getMetadata(): Promise<[{ contentType?: string; size?: number; metadata?: Record<string, string> }]> {
    const stats = statSync(this.fullPath);
    const metadata = readMetadata(this.fullPath);
    const ext = basename(this.fullPath).split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
      js: 'application/javascript',
      css: 'text/css',
      html: 'text/html',
    };
    return [{
      contentType: ext ? mimeTypes[ext] : 'application/octet-stream',
      size: stats.size,
      metadata: metadata || {},
    }];
  }

  createReadStream(): NodeJS.ReadableStream {
    return createReadStream(this.fullPath);
  }

  async setMetadata(options: { metadata: Record<string, string> }): Promise<void> {
    writeMetadata(this.fullPath, options.metadata);
  }
}

class LocalBucket {
  constructor(private readonly bucketPath: string) {}

  file(objectName: string): LocalFile {
    const fullPath = join(this.bucketPath, objectName);
    const bucketName = basename(this.bucketPath);
    return new LocalFile(objectName, bucketName, fullPath);
  }
}

class LocalStorage {
  bucket(bucketName: string): LocalBucket {
    const bucketPath = join(LOCAL_STORAGE_ROOT, bucketName);
    ensureDir(bucketPath);
    return new LocalBucket(bucketPath);
  }
}

export const localStorageClient = new LocalStorage();

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class LocalObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || PUBLIC_OBJECT_SEARCH_PATHS;
    const paths = Array.from(
      new Set(
        pathsStr
          .split(',')
          .map((path) => path.trim())
          .filter((path) => path.length > 0),
      ),
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Set LOCAL_OBJECT_STORAGE_ROOT or PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths).",
      );
    }
    paths.forEach(p => ensureDir(p));
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || PRIVATE_OBJECT_DIR;
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Set LOCAL_OBJECT_STORAGE_ROOT or PRIVATE_OBJECT_DIR env var.",
      );
    }
    ensureDir(dir);
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<LocalFile | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = join(searchPath, filePath);
      const bucketName = basename(searchPath);
      const objectName = filePath;
      const bucket = localStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  async downloadObject(
    file: LocalFile,
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === 'public';

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers: Record<string, string> = {
      'Content-Type':
        (metadata.contentType as string) || 'application/octet-stream',
      'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${cacheTtlSec}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    };
    if (metadata.size) {
      headers['Content-Length'] = String(metadata.size);
    }

    return new Response(webStream, { headers });
  }

  private getOwnerSegment(userId: string): string {
    return createHash('sha256').update(userId).digest('hex').slice(0, 24);
  }

  isObjectOwnedBy(objectPath: string, userId: string): boolean {
    return objectPath.startsWith(
      `/objects/uploads/${this.getOwnerSegment(userId)}/`,
    );
  }

  async getObjectEntityUploadURL(userId: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Set LOCAL_OBJECT_STORAGE_ROOT or PRIVATE_OBJECT_DIR env var.",
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${this.getOwnerSegment(userId)}/${objectId}`;
    ensureDir(dirname(fullPath));
    
    writeFileSync(fullPath, '');

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/storage/objects/uploads/${this.getOwnerSegment(userId)}/${objectId}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<LocalFile> {
    if (!objectPath.startsWith('/objects/')) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split('/');
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join('/');
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith('/')) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = join(entityDir, entityId);
    
    if (!existsSync(objectEntityPath)) {
      throw new ObjectNotFoundError();
    }

    const bucketName = basename(entityDir);
    const objectName = entityId;
    const bucket = localStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('/api/storage/objects/')) {
      return rawPath;
    }

    const objectEntityDir = this.getPrivateObjectDir();
    const prefix = `/api/storage/objects/`;
    
    if (!rawPath.startsWith(prefix)) {
      return rawPath;
    }

    const entityId = rawPath.slice(prefix.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith('/')) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: LocalFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile: objectFile as any,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

export const objectStorageClient = localStorageClient;
export const ObjectStorageService = LocalObjectStorageService;