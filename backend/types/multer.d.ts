declare module 'multer' {
  import type { Request } from 'express';

  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    stream: NodeJS.ReadableStream;
  }

  export interface Multer {
    // Express middleware signatures
    fields(fields: Array<{ name: string; maxCount?: number }>): (req: Request, res: any, next: (err?: any) => void) => void;
  }

  interface StorageEngine {}

  export interface MulterOptions {
    storage?: StorageEngine;
    limits?: { fileSize?: number };
  }

  export function multer(options?: MulterOptions): Multer;
  export namespace multer {
    function memoryStorage(): StorageEngine;
  }

  const multerExport: {
    (options?: MulterOptions): Multer;
    memoryStorage: () => StorageEngine;
  };

  export default multerExport;
}

