import { NextResponse } from "next/server";
import { prisma } from "../prisma";

export async function GET() {
  const logs = await prisma.log.findMany();
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const data = await request.json();
  const log = await prisma.log.create({ data });
  return NextResponse.json(log);
}

export async function PUT(request: Request) {
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: 'Missing log id' }, { status: 400 });
  }
  const log = await prisma.log.update({
    where: { id: data.id },
    data,
  });
  return NextResponse.json(log);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing log id' }, { status: 400 });
  }
  await prisma.log.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
