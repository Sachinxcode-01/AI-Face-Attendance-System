import { redirect } from 'next/navigation';

export default function AdminSecurityRoute() {
  redirect('/dashboard?tab=users');
}
