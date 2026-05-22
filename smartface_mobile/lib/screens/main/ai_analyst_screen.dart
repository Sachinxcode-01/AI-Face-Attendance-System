import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';

class AIAnalystScreen extends StatefulWidget {
  const AIAnalystScreen({super.key});

  @override
  State<AIAnalystScreen> createState() => _AIAnalystScreenState();
}

class _AIAnalystScreenState extends State<AIAnalystScreen> {
  final List<Map<String, dynamic>> _messages = [
    {
      'isMe': false,
      'text': 'Hello! I am your SmartFace AI Analyst. How can I help you with your academic performance today?',
      'time': 'Just now'
    }
  ];
  final TextEditingController _controller = TextEditingController();
  bool _isTyping = false;

  void _sendMessage() async {
    if (_controller.text.isEmpty) return;
    
    final userQuery = _controller.text;
    setState(() {
      _messages.add({
        'isMe': true,
        'text': userQuery,
        'time': 'Now'
      });
      _isTyping = true;
    });
    
    _controller.clear();

    // CALL REAL AI ENGINE
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final email = args?['email'] ?? 'student@smartface.elite';
    final result = await ApiService.askAI(email, userQuery);

    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add({
          'isMe': false,
          'text': result['response'] ?? 'I apologize, but my neural processing units are currently undergoing maintenance. Please try again in a few minutes.',
          'time': 'Just now'
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A0E21),
            Color(0xFF1D2671),
          ],
        ),
        image: DecorationImage(
          image: const NetworkImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.15),
            BlendMode.dstATop,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
        title: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFFFD700),
              child: Icon(Icons.psychology, color: Colors.black),
            ),
            const SizedBox(width: 15),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Analyst', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                const Text('Neural Engine Online', style: TextStyle(fontSize: 10, color: Colors.greenAccent)),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return _buildChatBubble(msg['text'], msg['isMe']);
              },
            ),
          ),
          if (_isTyping)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 30, vertical: 10),
              child: Row(
                children: [
                  Text('AI is thinking...', style: TextStyle(color: Colors.white30, fontSize: 10)),
                ],
              ),
            ).animate().shimmer(),
          _buildInputArea(),
        ],
      ),
    ),
    );
  }

  Widget _buildChatBubble(String text, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFFFFD700) : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isMe ? 20 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 20),
          ),
          border: isMe ? null : Border.all(color: Colors.white10),
        ),
        child: Text(
          text,
          style: TextStyle(color: isMe ? Colors.black : Colors.white, fontWeight: isMe ? FontWeight.bold : FontWeight.normal),
        ),
      ),
    ).animate().fadeIn().slideX(begin: isMe ? 0.1 : -0.1);
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        border: const Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Ask your AI analyst...',
                hintStyle: const TextStyle(color: Colors.white24),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 10),
          CircleAvatar(
            backgroundColor: const Color(0xFFFFD700),
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.black),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
