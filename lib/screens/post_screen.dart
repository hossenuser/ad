import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/blog_post.dart';
import '../main.dart';

class PostScreen extends StatelessWidget {
  const PostScreen({super.key, required this.post});
  final BlogPost post;

  Future<void> _open(String value) async {
    final uri = Uri.tryParse(value);
    if (uri == null || !{'http', 'https'}.contains(uri.scheme)) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App Details')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(post.title, style: const TextStyle(
            fontSize: 23, fontWeight: FontWeight.w900, height: 1.2)),
        const SizedBox(height: 10),
        Wrap(spacing: 6, runSpacing: 6, children: post.categories.map((c) =>
          Chip(label: Text(c, style: const TextStyle(fontSize: 11)),
            backgroundColor: MhAppsGalleryApp.panel,
            side: BorderSide.none)).toList()),
        const SizedBox(height: 12),
        if (post.published != null)
          Text('Published: ${post.published!.toLocal().toString().split(' ').first}',
              style: const TextStyle(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 18),
        HtmlWidget(
          post.content,
          textStyle: TextStyle(
              color: Colors.white.withOpacity(.88), fontSize: 15, height: 1.5),
          customStylesBuilder: (e) {
            if (e.localName == 'a') return {'color': '#22D3EE'};
            if (const {'h1', 'h2', 'h3'}.contains(e.localName)) {
              return {'color': '#FFFFFF', 'font-weight': 'bold'};
            }
            return null;
          },
          onTapUrl: (url) async { await _open(url); return true; },
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: post.url.isEmpty ? null : () => _open(post.url),
          icon: const Icon(Icons.open_in_new),
          label: const Text('OPEN ORIGINAL BLOG POST'),
          style: FilledButton.styleFrom(
            backgroundColor: MhAppsGalleryApp.blue,
            minimumSize: const Size.fromHeight(52),
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'Check the publisher and file details before downloading. MH Apps Gallery links to official or permissioned files only.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white54, fontSize: 11),
        ),
      ]),
    );
  }
}
