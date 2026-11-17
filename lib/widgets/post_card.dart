import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/blog_post.dart';
import '../main.dart';

class PostCard extends StatelessWidget {
  const PostCard({
    super.key,
    required this.post,
    required this.onTap,
    this.isSaved = false,
    this.onToggleSave,
  });

  final BlogPost post;
  final VoidCallback onTap;
  final bool isSaved;
  final VoidCallback? onToggleSave;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(11),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 94, height: 94,
                child: post.thumbnail == null
                    ? _placeholder()
                    : CachedNetworkImage(
                        imageUrl: post.thumbnail!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => _placeholder(),
                        placeholder: (_, __) => _placeholder(),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: post.categories.isNotEmpty
                          ? Text(post.categories.take(2).join(' • ').toUpperCase(),
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: MhAppsGalleryApp.cyan,
                                  fontSize: 9, fontWeight: FontWeight.bold))
                          : const SizedBox.shrink(),
                    ),
                    if (onToggleSave != null)
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: Icon(
                          isSaved ? Icons.bookmark : Icons.bookmark_border,
                          size: 18,
                          color: isSaved ? MhAppsGalleryApp.cyan : Colors.white54,
                        ),
                        onPressed: onToggleSave,
                      ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(post.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold,
                        fontSize: 14, height: 1.25)),
                const SizedBox(height: 5),
                Text(post.summary, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white60,
                        fontSize: 11, height: 1.35)),
                const SizedBox(height: 7),
                const Row(children: [
                  Text('VIEW DETAILS', style: TextStyle(
                      color: MhAppsGalleryApp.cyan, fontSize: 9,
                      fontWeight: FontWeight.bold)),
                  SizedBox(width: 4),
                  Icon(Icons.arrow_forward, size: 11, color: MhAppsGalleryApp.cyan),
                ]),
              ],
            )),
          ]),
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
    color: const Color(0xFF102844),
    child: const Icon(Icons.apps_rounded, color: MhAppsGalleryApp.cyan, size: 35),
  );
}
