import dynamic from 'next/dynamic';
import StudentSectionLoading from '../loading';

const StudentNexaChatView = dynamic(
  () => import('@/features/student/nexa/components/StudentNexaChatView').then((m) => m.StudentNexaChatView),
  { loading: () => <StudentSectionLoading /> },
);

export default function StudentAiChatPage() {
  return <StudentNexaChatView />;
}
