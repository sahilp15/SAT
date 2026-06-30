// Single local profile helper.
// V1 is single-user. Rather than build auth, we ensure exactly one local User
// row exists and treat it as "me". This is the only place that assumption lives,
// so adding real multi-user auth later means changing just this function.

import { prisma } from "./db";

export const LOCAL_USER_EMAIL = "local@sat-prep.app";

export async function getLocalUser() {
  let user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: LOCAL_USER_EMAIL,
        name: "Me",
        profile: { create: {} },
        settings: { create: {} },
      },
    });
  }
  // Ensure related rows exist (defensive for older rows).
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  if (!profile) await prisma.studentProfile.create({ data: { userId: user.id } });
  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!settings) await prisma.settings.create({ data: { userId: user.id } });
  return user;
}

export async function getLocalUserWithProfile() {
  const user = await getLocalUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { profile: true, settings: true },
  });
}
