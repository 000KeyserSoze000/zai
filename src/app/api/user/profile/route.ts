import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db as prisma } from '@/lib/db';

// GET - Fetch business profile for current user
export async function GET() {
  console.log('### Business Profile API - START GET ###');
  const user = await getSession();
  console.log('### Business Profile API - USER ###', user ? { id: user.id, email: user.email } : 'NULL');

  if (!user?.id) {
    console.log('### Business Profile API - UNAUTHORIZED ###');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('### Business Profile API - FETCHING ###', user.id);
    let profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    // If no profile exists, create a default one
    if (!profile) {
      console.log('### Business Profile API - NOT FOUND, CREATING DEFAULT ###');
      profile = await prisma.businessProfile.create({
        data: {
          userId: user.id,
          brandName: '',
          companyName: '',
          targetAudience: '',
          valueProposition: '',
          toneOfVoice: '',
        },
      });
      console.log('### Business Profile API - CREATED ###', profile.id);
    } else {
      console.log('### Business Profile API - FOUND ###', profile.id);
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('### Business Profile API - ERROR ###', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message, stack: error.stack }, { status: 500 });
  }
}

// PATCH - Update business profile
export async function PATCH(request: NextRequest) {
  console.log('### Business Profile API - START PATCH ###');
  const user = await getSession();
  console.log('### Business Profile API - USER ###', user ? { id: user.id, email: user.email } : 'NULL');

  if (!user?.id) {
    console.log('### Business Profile API - UNAUTHORIZED ###');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brandName, companyName, targetAudience, valueProposition, toneOfVoice } = body;

    console.log('### Business Profile API - UPDATING ###', user.id);
    
    // Prepare update data: only include fields that are strings (including empty strings)
    // Filter out null or undefined to avoid erasing data if partial objects are sent
    const updateData: any = {};
    if (typeof brandName === 'string') updateData.brandName = brandName;
    if (typeof companyName === 'string') updateData.companyName = companyName;
    if (typeof targetAudience === 'string') updateData.targetAudience = targetAudience;
    if (typeof valueProposition === 'string') updateData.valueProposition = valueProposition;
    if (typeof toneOfVoice === 'string') updateData.toneOfVoice = toneOfVoice;

    if (Object.keys(updateData).length === 0) {
      console.log('### Business Profile API - NO DATA TO UPDATE ###');
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData
      },
    });

    console.log('### Business Profile API - UPDATED ###', profile.id);
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('### Business Profile API - ERROR ###', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message, stack: error.stack }, { status: 500 });
  }
}
