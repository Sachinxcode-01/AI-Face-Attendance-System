import 'package:flutter/material.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

void main() {
  group('AppAnimatedHeading', () {
    testWidgets('renders plain text on reduced motion', (tester) async {
      await tester.pumpWidget(
        const MediaQuery(
          data: MediaQueryData(disableAnimations: true),
          child: MaterialApp(
            home: Scaffold(
              body: AppAnimatedHeading(text: 'Hello'),
            ),
          ),
        ),
      );
      expect(find.text('Hello'), findsOneWidget);
      expect(find.byType(AnimatedTextKit), findsNothing);
    });

    testWidgets('renders fade animated text by default', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppAnimatedHeading(text: 'Welcome'),
          ),
        ),
      );
      expect(find.byType(AnimatedTextKit), findsOneWidget);
    });

    testWidgets('renders typing effect when isTypingEffect is true', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppAnimatedHeading(
              text: 'typing',
              isTypingEffect: true,
            ),
          ),
        ),
      );
      final kit = tester.widget<AnimatedTextKit>(find.byType(AnimatedTextKit));
      expect(kit, isNotNull);
      expect(kit.animatedTexts.first, isA<TypewriterAnimatedText>());
    });

    testWidgets('validates custom duration and style', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppAnimatedHeading(
              text: 'duration test',
              totalDuration: Duration(milliseconds: 2500),
              style: TextStyle(fontSize: 20, color: Colors.blue),
            ),
          ),
        ),
      );
      final kit = tester.widget<AnimatedTextKit>(find.byType(AnimatedTextKit));
      expect(kit, isNotNull);
      expect(kit.animatedTexts.first, isA<FadeAnimatedText>());
    });
  });
}
