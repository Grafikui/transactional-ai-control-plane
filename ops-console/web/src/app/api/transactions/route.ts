import { NextResponse } from "next/server";
import { prisma } from "../prisma";

export async function GET() {
  const transactions = await prisma.transaction.findMany();
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const data = await request.json();
  const transaction = await prisma.transaction.create({ data });
  return NextResponse.json(transaction);
}

export async function PUT(request: Request) {
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
  }
  const transaction = await prisma.transaction.update({
    where: { id: data.id },
    data,
  });
  return NextResponse.json(transaction);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
  }
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
