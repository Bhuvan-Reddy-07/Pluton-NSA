import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * High-performance streaming API for NASA LRO 15K GLTF/GLB models
 * Supports:
 * - Full 116.5MB NASA LRO 15K Master Model (Moon_NASA_LRO_15k_Grid.glb)
 * - Fast 7MB Preview Model (Moon_NASA_LRO_15k_Grid_Small.glb)
 * - HTTP Range requests (206 Partial Content) for zero-latency 3D streaming in Three.js
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resType = searchParams.get('res') || 'master';

    // Base directory of the repository
    const baseDir = process.cwd();

    let targetFilePath: string;
    if (resType === 'small') {
      targetFilePath = path.join(baseDir, 'public', 'models', 'Moon_NASA_LRO_15k_Grid_Small.glb');
      if (!fs.existsSync(targetFilePath)) {
        targetFilePath = path.join(baseDir, 'public', 'Moon_NASA_LRO_15k_Grid_Small.glb');
      }
    } else {
      // Master 116.5MB file
      targetFilePath = path.join(baseDir, 'Moon_NASA_LRO_15k_Grid.glb');
      if (!fs.existsSync(targetFilePath)) {
        targetFilePath = path.join(baseDir, 'public', 'models', 'Moon_NASA_LRO_15k_Grid.glb');
      }
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse(
        JSON.stringify({ error: 'GLB model file not found on disk', searchedPath: targetFilePath }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stat = fs.statSync(targetFilePath);
    const fileSize = stat.size;
    const rangeHeader = request.headers.get('range');

    // Handle Range Requests (Three.js WebGL streaming)
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(targetFilePath, { start, end });

      // Convert Node readable stream to Web standard ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'model/gltf-binary',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Full file response
    const fileStream = fs.createReadStream(targetFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'model/gltf-binary',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error streaming GLB model', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

