import 'package:flutter/material.dart';
import 'admin/admin_dashboard.dart';
import 'teacher/teacher_dashboard.dart';
import 'student/student_dashboard.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
    final String role = args?['role']?.toString().toLowerCase() ?? 'student';

    if (role == 'admin') {
      return const AdminDashboard();
    } else if (role == 'teacher' || role == 'faculty' || role == 'lecturer') {
      return const TeacherDashboard();
    } else {
      return const StudentDashboard();
    }
  }
}
