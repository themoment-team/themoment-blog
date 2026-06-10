'use server';

import { signIn, signOut } from '@features/auth/config';

export async function loginWithDataGSM() {
  await signIn('datagsm', { redirectTo: '/' });
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}
