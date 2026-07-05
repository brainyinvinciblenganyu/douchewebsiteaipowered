import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '../../../../backend/server/auth/session';
import { findUserById } from '../../../../backend/server/db/queries';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        membership: null,
        location: user.location,
        preferences: [],
        avatar: null,
        bio: null,
      },
    });
  } catch (e) {
    console.error('me error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

