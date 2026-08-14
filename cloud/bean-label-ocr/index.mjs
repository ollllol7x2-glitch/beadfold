import http from 'node:http';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { parseBeanLabelText } from './parser.mjs';

const port = Number(process.env.PORT ?? 8080);
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean));
const maxRequestsPerHour = Number(process.env.MAX_REQUESTS_PER_HOUR ?? 30);
const requestWindow = new Map();
const client = new ImageAnnotatorClient();

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  if (request.method === 'OPTIONS') return response.writeHead(204, corsHeaders()).end();
  if (request.method === 'GET' && request.url === '/healthz') return send(response, 200, { ok: true });
  if (request.method !== 'POST' || request.url !== '/v1/bean-label/parse') return send(response, 404, { error: '경로를 찾을 수 없어요.' });
  if (origin && !allowedOrigins.has(origin)) return send(response, 403, { error: '허용되지 않은 요청 출처예요.' });

  const address = request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? request.socket.remoteAddress ?? 'unknown';
  if (!allowRequest(address)) return send(response, 429, { error: '잠시 후 다시 촬영해주세요.' });

  try {
    const body = await readJson(request);
    if (typeof body.imageBase64 !== 'string' || body.imageBase64.length < 100) return send(response, 400, { error: '사진을 읽지 못했어요.' });
    const [visionResult] = await client.documentTextDetection({ image: { content: body.imageBase64 } });
    const fullText = visionResult.fullTextAnnotation?.text ?? visionResult.textAnnotations?.[0]?.description ?? '';
    if (!fullText.trim()) return send(response, 422, { error: '봉투에서 읽을 수 있는 글자를 찾지 못했어요. 직접 입력해주세요.' });
    return send(response, 200, parseBeanLabelText(fullText));
  } catch (error) {
    console.error('bean-label-ocr failed', error instanceof Error ? error.message : error);
    return send(response, 500, { error: '자동 인식을 완료하지 못했어요. 직접 입력할 수 있어요.' });
  }
});

server.listen(port, () => console.log(`bean-label-ocr listening on ${port}`));

function corsHeaders() {
  return { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
}

function send(response, status, body) {
  response.writeHead(status, { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 7_000_000) reject(new Error('payload too large'));
    });
    request.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('invalid json')); } });
    request.on('error', reject);
  });
}

function allowRequest(address) {
  const now = Date.now();
  const entry = requestWindow.get(address) ?? { startedAt: now, count: 0 };
  if (now - entry.startedAt > 60 * 60 * 1000) { entry.startedAt = now; entry.count = 0; }
  entry.count += 1;
  requestWindow.set(address, entry);
  return entry.count <= maxRequestsPerHour;
}
