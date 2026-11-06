import { redirect } from 'next/navigation';

export default function StudentScannerRoute() {
  redirect('/dashboard?tab=attendance');
}
