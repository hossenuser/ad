class BlogPost {
  const BlogPost({
    required this.id,
    required this.title,
    required this.url,
    required this.published,
    required this.summary,
    required this.content,
    required this.categories,
    this.thumbnail,
  });

  final String id;
  final String title;
  final String url;
  final DateTime? published;
  final String summary;
  final String content;
  final List<String> categories;
  final String? thumbnail;

  static List<String> inferCategories(
    List<String> explicit,
    String title,
    String summary,
  ) {
    final result = <String>{...explicit};
    final text = '$title $summary'.toLowerCase();

    if (RegExp(r'\b(windows|win10|win11|win7|pc|exe|x64|x86|driver|taskbar|bijoy|office|photoshop|autocad|illustrator|winrar|idm|rufus)\b')
        .hasMatch(text)) {
      result.add('Windows');
    }
    if (RegExp(r'\b(android|apk|mobile|phone)\b').hasMatch(text)) {
      result.add('Android');
    }
    if (RegExp(r'\b(ios|iphone|ipad|ipa)\b').hasMatch(text)) {
      result.add('iOS');
    }
    if (RegExp(r'\b(mac|macos|dmg|apple silicon)\b').hasMatch(text)) {
      result.add('macOS');
    }
    if (RegExp(r'\b(tool|utility|driver|converter|downloader|partition|recovery|cleanup|upscaler|framework)\b')
        .hasMatch(text)) {
      result.add('Tools');
    }
    if (RegExp(r'\b(game|gaming)\b').hasMatch(text)) {
      result.add('Games');
    }
    if (result.isEmpty || result.contains('Windows') || result.contains('Android')) {
      result.add('Apps');
    }
    return result.toList();
  }

  factory BlogPost.fromJson(Map<String, dynamic> json) {
    final links = (json['link'] as List? ?? const []);
    final alternate = links.cast<Map>().where(
      (e) => e['rel'] == 'alternate',
    );
    final url = alternate.isNotEmpty ? '${alternate.first['href']}' : '';
    final title = (json['title']?['\$t'] ?? 'Untitled').toString();
    final content = (json['content']?['\$t'] ??
            json['summary']?['\$t'] ??
            '')
        .toString();
    final summary = (json['summary']?['\$t'] ?? content)
        .toString()
        .replaceAll(RegExp(r'<[^>]*>'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    String? thumbnail = json['media\$thumbnail']?['url']?.toString();
    if (thumbnail == null) {
      final match = RegExp(r'''<img[^>]+src=["']([^"']+)''')
          .firstMatch(content);
      thumbnail = match?.group(1)?.replaceAll('&amp;', '&');
    }

    final explicitCategories = (json['category'] as List? ?? const [])
        .map((e) => (e['term'] ?? '').toString())
        .where((e) => e.isNotEmpty)
        .toList();

    return BlogPost(
      id: (json['id']?['\$t'] ?? url).toString(),
      title: title,
      url: url,
      published: DateTime.tryParse(
        (json['published']?['\$t'] ?? '').toString(),
      ),
      summary: summary,
      content: content,
      categories: inferCategories(explicitCategories, title, summary),
      thumbnail: thumbnail,
    );
  }
}
