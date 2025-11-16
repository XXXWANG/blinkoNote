import { createClient } from 'webdav';
import { prisma } from '../prisma';
import { getGlobalConfig } from '../routerTrpc/config';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { FileService } from '../lib/files';

export class WebDAVService {
  static async getClient() {
    const config = await getGlobalConfig({ useAdmin: true });
    if (!config.webdavEnable) return null;
    if (!config.webdavUrl || !config.webdavUsername || !config.webdavPassword) return null;
    if (config.webdavUrl.startsWith('file://')) {
      const localRoot = config.webdavUrl.replace('file://', '') + (config.webdavRootPath || '/blinko');
      return { client: null, root: localRoot, local: true } as any;
    }
    const auth = Buffer.from(`${config.webdavUsername}:${config.webdavPassword}`).toString('base64');
    const client = createClient(config.webdavUrl, {
      username: config.webdavUsername,
      password: config.webdavPassword,
      headers: { Authorization: `Basic ${auth}` },
    });
    const root = config.webdavRootPath || '/blinko';
    return { client, root } as any;
  }

  private static async ensureDir(client: any, dirPath: string, isLocal?: boolean) {
    if (isLocal) {
      await fs.mkdir(dirPath, { recursive: true });
      return;
    }
    try {
      await client.stat(dirPath);
    } catch {
      await client.createDirectory(dirPath, { recursive: true });
    }
  }

  private static hashBuffer(buf: Buffer) {
    return crypto.createHash('sha1').update(buf).digest('hex');
  }

  private static hashText(text: string) {
    return crypto.createHash('sha1').update(text || '').digest('hex');
  }

  static async pushNotes() {
    const cli = await WebDAVService.getClient();
    if (!cli) return { enabled: false };
    const { client, root, local } = cli as any;
    const notes = await prisma.notes.findMany({
      select: {
        id: true,
        content: true,
        type: true,
        isArchived: true,
        isRecycle: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        attachments: true,
      },
    });
    await this.ensureDir(client, root, local);
    await this.ensureDir(client, `${root}/notes`, local);
    await this.ensureDir(client, `${root}/attachments`, local);

    const index: Array<{ id: number, updatedAt: string, etag: string, attachments: Array<{ name: string, etag: string, size: number }> }> = [];

    for (const n of notes) {
      const noteJson = {
        id: n.id,
        content: n.content,
        type: n.type,
        isArchived: n.isArchived,
        isRecycle: n.isRecycle,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        metadata: n.metadata,
      };
      const text = JSON.stringify(noteJson);
      const etag = this.hashText(text);
      const notePath = `${root}/notes/${n.id}.json`;
      if (local) {
        await fs.writeFile(notePath, Buffer.from(text));
      } else {
        await client.putFileContents(notePath, Buffer.from(text), { overwrite: true });
      }

      const attInfos: Array<{ name: string, etag: string, size: number }> = [];
      if (n.attachments && n.attachments.length) {
        await this.ensureDir(client, `${root}/attachments/${n.id}`, local);
        for (const a of n.attachments) {
          try {
            const buf = await FileService.getFileBuffer(a.path);
            const aHash = this.hashBuffer(buf);
            const remote = `${root}/attachments/${n.id}/${a.name || path.basename(a.path)}`;
            if (local) {
              await fs.writeFile(remote, buf);
            } else {
              await client.putFileContents(remote, buf, { overwrite: true });
            }
            attInfos.push({ name: a.name || path.basename(a.path), etag: aHash, size: Number(a.size) });
          } catch (e) {
            // skip broken attachment
          }
        }
      }
      index.push({ id: n.id, updatedAt: n.updatedAt.toISOString(), etag, attachments: attInfos });
    }

    const indexPath = `${root}/index.json`;
    const idxBuf = Buffer.from(JSON.stringify({ exportTime: new Date(), index }, null, 2));
    if (local) {
      await fs.writeFile(indexPath, idxBuf);
    } else {
      await client.putFileContents(indexPath, idxBuf, { overwrite: true });
    }
    return { enabled: true, indexPath, count: notes.length };
  }

  static async pullNotes() {
    const cli = await WebDAVService.getClient();
    if (!cli) return { enabled: false };
    const { client, root, local } = cli as any;
    const indexPath = `${root}/index.json`;
    try {
      const buf = local ? await fs.readFile(indexPath) : await client.getFileContents(indexPath, { format: 'binary' });
      const text = Buffer.isBuffer(buf) ? buf.toString('utf-8') : String(buf);
      const data = JSON.parse(text);
      const items: Array<{ id: number, updatedAt: string, etag: string }> = data?.index || [];

      let updated = 0;
      for (const it of items) {
        const local = await prisma.notes.findFirst({ where: { id: it.id }, select: { updatedAt: true } });
        const shouldUpdate = !local || new Date(it.updatedAt).getTime() > new Date(local.updatedAt).getTime();
        if (!shouldUpdate) continue;

        const np = `${root}/notes/${it.id}.json`;
        const nbuf = local ? await fs.readFile(np) : await client.getFileContents(np, { format: 'binary' });
        const ntext = Buffer.isBuffer(nbuf) ? nbuf.toString('utf-8') : String(nbuf);
        const n = JSON.parse(ntext);
        await prisma.notes.upsert({
          where: { id: n.id },
          update: {
            content: n.content,
            type: n.type,
            isArchived: n.isArchived,
            isRecycle: n.isRecycle,
            updatedAt: new Date(n.updatedAt),
            metadata: n.metadata,
          },
          create: {
            id: n.id,
            content: n.content,
            type: n.type,
            isArchived: n.isArchived,
            isRecycle: n.isRecycle,
            createdAt: new Date(n.createdAt),
            updatedAt: new Date(n.updatedAt),
            metadata: n.metadata,
          },
        });
        updated++;
      }
      return { enabled: true, indexPath, count: items.length, updated };
    } catch (e) {
      return { enabled: true, indexPath, error: (e as Error).message };
    }
  }
}
