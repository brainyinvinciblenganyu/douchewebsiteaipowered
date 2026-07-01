import { NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const HF_MODEL = 'openai/shap-e';

function getModelsDir() {
  return path.join(process.cwd(), 'public', 'models');
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    if (buffer.length < 100) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return NextResponse.json(
        {
          error:
            'Missing HF_TOKEN env var. Add HF_TOKEN in your Next.js environment to call Hugging Face.',
        },
        { status: 500 },
      );
    }

    // Hugging Face Inference API call.
    // Note: Shape-E expects the correct input format; this implementation mirrors the existing PHP approach.
    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer,
    });

    const resBuffer = Buffer.from(await hfRes.arrayBuffer());

    if (!hfRes.ok) {
      const detail = resBuffer.toString('utf8').slice(0, 2000);
      return NextResponse.json(
        {
          error: 'Hugging Face generation failed',
          status: hfRes.status,
          detail,
        },
        { status: 502 },
      );
    }

    const modelsDir = getModelsDir();
    await mkdir(modelsDir, { recursive: true });

    const filename = `model_${Date.now()}.glb`;
    const fullPath = path.join(modelsDir, filename);
    await writeFile(fullPath, resBuffer);

    return NextResponse.json({
      modelUrl: `/models/${filename}`,
      status: 'success',
    });
  } catch (error) {
    console.error('generate-3d error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

