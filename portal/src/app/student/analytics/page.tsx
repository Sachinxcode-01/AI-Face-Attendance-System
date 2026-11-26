import dynamic from 'next/dynamic';
import StudentSectionLoading from '../loading';

const StudentAnalyticsView = dynamic(
  () => import('@/features/student/analytics/components/StudentAnalyticsView').then((m) => m.StudentAnalyticsView),
  { loading: () => <StudentSectionLoading /> },
);

export default function StudentAnalyticsPage() {
  return <StudentAnalyticsView />;
}
