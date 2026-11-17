import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
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
        Html(
          data: post.content,
          style: {
            'body': Style(color: Colors.white.withOpacity(.88),
                fontSize: FontSize(15), lineHeight: LineHeight(1.5)),
            'a': Style(color: MhAppsGalleryApp.cyan),
            'h1,h2,h3': Style(color: Colors.white, fontWeight: FontWeight.bold),
            'img': Style(width: Width(100, Unit.percent)),
          },
          onLinkTap: (url, _, __) { if (url != null) _open(url); },
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
