import dynamic from 'next/dynamic';
import StudentSectionLoading from '../loading';

const StudentCheckinView = dynamic(
  () => import('@/features/student/checkin/components/StudentCheckinView').then((m) => m.StudentCheckinView),
  { loading: () => <StudentSectionLoading /> },
);

export default function StudentCheckinPage() {
  return <StudentCheckinView />;
}
