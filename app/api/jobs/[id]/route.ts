import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getJob } from '../route';

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const job = getJob(context.params.id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}
