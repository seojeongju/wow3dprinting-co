import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = getDb();
    
    // DB에서 카테고리 목록 전체 조회
    const allCategories = await db.select().from(categories);
    
    return NextResponse.json({
      success: true,
      categories: allCategories,
    });
  } catch (error: any) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { success: false, message: '카테고리를 불러오는 데 실패했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
