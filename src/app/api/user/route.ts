import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * Return the current authenticated user's safe profile.
 * Never create an owner account from a GET request or disclose password hashes.
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image ?? null,
  });
}
