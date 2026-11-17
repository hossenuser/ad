import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart';
import '../models/blog_post.dart';
import '../services/blogger_service.dart';
import '../widgets/post_card.dart';
import 'post_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _service = BloggerService();
  final _search = TextEditingController();
  List<BlogPost> _posts = [];
  Set<String> _savedIds = {};
  bool _loading = true;
  String? _error;
  String _category = 'All';

  static const categories = [
    'All', 'Windows', 'Android', 'iOS', 'macOS', 'Tools', 'Games', 'Apps', 'Saved'
  ];

  @override
  void initState() {
    super.initState();
    _loadSaved();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _loadSaved() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('saved_post_ids') ?? const [];
    if (mounted) {
      setState(() => _savedIds = list.toSet());
    }
  }

  Future<void> _toggleSaved(String id) async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      if (_savedIds.contains(id)) {
        _savedIds.remove(id);
      } else {
        _savedIds.add(id);
      }
    });
    await prefs.setStringList('saved_post_ids', _savedIds.toList());
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final posts = await _service.fetchPosts();
      if (!mounted) return;
      setState(() { _posts = posts; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<BlogPost> get _visiblePosts {
    final query = _search.text.trim().toLowerCase();
    return _posts.where((post) {
      final categoryMatch = _category == 'All' ||
          (_category == 'Saved'
              ? _savedIds.contains(post.id)
              : post.categories.any((c) => c.toLowerCase() == _category.toLowerCase()));
      final searchMatch = query.isEmpty ||
          post.title.toLowerCase().contains(query) ||
          post.summary.toLowerCase().contains(query) ||
          post.categories.join(' ').toLowerCase().contains(query);
      return categoryMatch && searchMatch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Image.asset('assets/brand/mh_apps_gallery_original.png',
              width: 43, height: 43, fit: BoxFit.contain),
          const SizedBox(width: 10),
          const Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('MH APPS GALLERY',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              Text('YOUR APPS & SOFTWARE HUB',
                  style: TextStyle(fontSize: 9, color: MhAppsGalleryApp.cyan,
                      letterSpacing: 1.2)),
            ],
          )),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ]),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _hero(),
            const SizedBox(height: 18),
            TextField(
              controller: _search,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'Search apps, games, tools...',
                prefixIcon: Icon(Icons.search, color: MhAppsGalleryApp.cyan),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 42,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final item = categories[index];
                  final selected = item == _category;
                  return ChoiceChip(
                    label: Text(item),
                    selected: selected,
                    onSelected: (_) => setState(() => _category = item),
                    selectedColor: MhAppsGalleryApp.blue,
                    backgroundColor: MhAppsGalleryApp.panel,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Colors.white70,
                      fontWeight: FontWeight.w600,
                    ),
                    side: BorderSide.none,
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            Row(children: [
              const Expanded(child: Text('Latest Apps & Software',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold))),
              Text('${_visiblePosts.length} posts',
                  style: const TextStyle(color: Colors.white54, fontSize: 12)),
            ]),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              _message('Could not load Blogger feed', _error!,
                  action: 'Try again', onPressed: _load)
            else if (_visiblePosts.isEmpty)
              _message('No posts found',
                  'Try another search or select a different category.')
            else
              ..._visiblePosts.map((post) => PostCard(
                post: post,
                isSaved: _savedIds.contains(post.id),
                onToggleSave: () => _toggleSaved(post.id),
                onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => PostScreen(post: post))),
              )),
            const SizedBox(height: 24),
            const Center(child: Text(
              '© MH Apps Gallery • Official or permissioned downloads only',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white38, fontSize: 11),
            )),
          ],
        ),
      ),
    );
  }

  Widget _hero() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: const LinearGradient(
        colors: [Color(0xFF073B78), Color(0xFF07182D), Color(0xFF062C46)],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ),
      border: Border.all(color: MhAppsGalleryApp.cyan.withOpacity(.35)),
    ),
    child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('DISCOVER • DOWNLOAD • EXPLORE',
          style: TextStyle(color: MhAppsGalleryApp.cyan,
              fontSize: 10, letterSpacing: 1.4, fontWeight: FontWeight.bold)),
      SizedBox(height: 9),
      Text('Your Apps & Software Hub',
          style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900)),
      SizedBox(height: 5),
      Text('Find apps, PC software, tools and games across Windows, Android, macOS and iOS.',
          style: TextStyle(color: Colors.white70, height: 1.4)),
    ]),
  );

  Widget _message(String title, String body,
      {String? action, VoidCallback? onPressed}) => Container(
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      color: MhAppsGalleryApp.panel,
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(children: [
      const Icon(Icons.cloud_off_rounded, size: 34, color: MhAppsGalleryApp.cyan),
      const SizedBox(height: 10),
      Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 6),
      Text(body, textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white60, fontSize: 12)),
      if (action != null) ...[
        const SizedBox(height: 12),
        FilledButton(onPressed: onPressed, child: Text(action)),
      ],
    ]),
  );
}
