import dynamic from 'next/dynamic';
import StudentSectionLoading from '../../loading';

const StudentHeatmapView = dynamic(
  () => import('@/features/student/attendance/components/StudentHeatmapView').then((m) => m.StudentHeatmapView),
  { loading: () => <StudentSectionLoading /> },
);

export default function StudentHeatmapPage() {
  return <StudentHeatmapView />;
}
