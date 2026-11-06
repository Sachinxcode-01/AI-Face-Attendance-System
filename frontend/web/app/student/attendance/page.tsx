import { redirect } from 'next/navigation';

export default function StudentAttendanceRoute() {
  redirect('/dashboard?tab=attendance');
}
