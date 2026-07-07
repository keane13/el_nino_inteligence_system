import { NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

const options: any = {
  projectId: 'smooth-reason-491707-f6',
};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
const bq = new BigQuery(options);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({ error: 'Only SELECT queries are allowed' }, { status: 403 });
    }

    const [rows] = await bq.query(query);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error('BigQuery API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
