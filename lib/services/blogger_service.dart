import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/blog_post.dart';

class BloggerService {
  BloggerService({http.Client? client}) : _client = client ?? http.Client();

  static const blogUrl = 'https://mhappsgallery.blogspot.com';
  final http.Client _client;

  Future<List<BlogPost>> fetchPosts({int startIndex = 1, int maxResults = 50}) async {
    final feedUrl =
        '$blogUrl/feeds/posts/default?alt=json&start-index=$startIndex&max-results=$maxResults';
    final response = await _client.get(
      Uri.parse(feedUrl),
      headers: const {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw Exception('Blogger returned HTTP ${response.statusCode}');
    }

    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    final entries = decoded['feed']?['entry'] as List? ?? const [];
    return entries
        .whereType<Map<String, dynamic>>()
        .map(BlogPost.fromJson)
        .toList();
  }
}
