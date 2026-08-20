import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const _supabaseUrl = 'https://ohztxpkoxsypydihtlja.supabase.co';
const _supabasePublishableKey =
    'sb_publishable_1P2jzGAyH5s_TVsu4nuexQ_4L3MyQhm';

class BeanLabelOcrResult {
  const BeanLabelOcrResult({required this.fullText, required this.beanName});
  final String fullText;
  final String? beanName;
}

Future<BeanLabelOcrResult> recognizeBeanLabelOnDevice(XFile photo) async {
  if (kIsWeb) {
    throw UnsupportedError('사진 속 글자 읽기는 모바일 앱에서 사용할 수 있어요.');
  }
  final latinRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
  final koreanRecognizer = TextRecognizer(script: TextRecognitionScript.korean);
  try {
    final input = InputImage.fromFilePath(photo.path);
    final latinText = await latinRecognizer.processImage(input);
    final koreanText = await koreanRecognizer.processImage(input);
    final fullText = [latinText, koreanText]
        .expand((result) => result.text.split(RegExp(r'\r?\n')))
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .fold<List<String>>([], (lines, line) {
          if (!lines.contains(line)) lines.add(line);
          return lines;
        })
        .join('\n');
    if (fullText.trim().isEmpty) {
      throw StateError('봉투에서 읽을 수 있는 글자를 찾지 못했어요. 직접 입력해주세요.');
    }
    return BeanLabelOcrResult(
      fullText: fullText,
      beanName: _suggestBeanName(fullText),
    );
  } finally {
    await latinRecognizer.close();
    await koreanRecognizer.close();
  }
}

String? _suggestBeanName(String value) {
  final ignored = RegExp(
    r'^(coffee|roaster|roasted|roast date|process|variety|washed|natural|honey|net wt|weight|grams?|origin)$',
    caseSensitive: false,
  );
  final candidates = value
      .split(RegExp(r'\r?\n'))
      .map((line) => line.replaceAll(RegExp(r'\s+'), ' ').trim())
      .where((line) => line.length >= 3 && line.length <= 48)
      .where((line) => RegExp(r'[A-Za-z가-힣]').hasMatch(line))
      .where((line) => !ignored.hasMatch(line))
      .where((line) => !RegExp(r'^\d+[./-]\d+').hasMatch(line))
      .toList();
  return candidates.isEmpty ? null : candidates.first;
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: _supabaseUrl,
    publishableKey: _supabasePublishableKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );
  runApp(const BeanfoldApp());
}

class BeanfoldApp extends StatelessWidget {
  const BeanfoldApp({super.key});

  @override
  Widget build(BuildContext context) {
    const cream = Color(0xFFF8F4EE);
    const espresso = Color(0xFF2B2420);
    return MaterialApp(
      title: 'BEANFOLD',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: cream,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B0C4B),
          brightness: Brightness.light,
          surface: cream,
          onSurface: espresso,
        ),
        textTheme: ThemeData.light().textTheme.apply(
          bodyColor: espresso,
          displayColor: espresso,
          fontFamily: 'sans-serif',
        ),
      ),
      home: const SessionGate(),
    );
  }
}

class SessionGate extends StatelessWidget {
  const SessionGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        return BeanfoldHome(
          session: Supabase.instance.client.auth.currentSession,
        );
      },
    );
  }
}

class BeanfoldHome extends StatefulWidget {
  const BeanfoldHome({super.key, required this.session});
  final Session? session;

  @override
  State<BeanfoldHome> createState() => _BeanfoldHomeState();
}

class _BeanfoldHomeState extends State<BeanfoldHome> {
  final _repository = BeanRepository(Supabase.instance.client);
  var _index = 0;

  Future<void> _signIn() async {
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: kIsWeb ? null : 'com.beanfold.app://login-callback/',
      );
    } on AuthException catch (error) {
      if (mounted) _showMessage(error.message);
    }
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut(scope: SignOutScope.local);
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final isMember = widget.session?.user.isAnonymous == false;
    final pages = [
      HomePage(
        isMember: isMember,
        onSignIn: _signIn,
        onGoToCollection: () => setState(() => _index = 2),
      ),
      RecordPage(
        isMember: isMember,
        repository: _repository,
        onSignIn: _signIn,
      ),
      CollectionPage(
        isMember: isMember,
        repository: _repository,
        onSignIn: _signIn,
      ),
      ProfilePage(
        isMember: isMember,
        email: widget.session?.user.email,
        onSignIn: _signIn,
        onSignOut: _signOut,
      ),
    ];
    return Scaffold(
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: KeyedSubtree(key: ValueKey(_index), child: pages[_index]),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) {
          HapticFeedback.selectionClick();
          setState(() => _index = value);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '홈',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book),
            label: '기록',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: '보관함',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: '마이페이지',
          ),
        ],
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({
    super.key,
    required this.isMember,
    required this.onSignIn,
    required this.onGoToCollection,
  });
  final bool isMember;
  final Future<void> Function() onSignIn;
  final VoidCallback onGoToCollection;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
      children: [
        Text(
          'BEANFOLD',
          style: theme.textTheme.labelLarge?.copyWith(letterSpacing: 4),
        ),
        const SizedBox(height: 34),
        Text(
          '오늘 어떤 한 잔을\n내려볼까요?',
          style: theme.textTheme.displaySmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          '원두와 레시피를 기록하고, 나만의 기준을 찾아보세요.',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: const Color(0xFF746960),
          ),
        ),
        const SizedBox(height: 28),
        _PrimaryCard(
          title: isMember ? '보관한 원두로 시작하기' : 'Google 로그인하고 시작하기',
          body: isMember ? '오늘 내릴 원두와 레시피를 선택해요.' : '기록은 로그인한 계정에 안전하게 저장돼요.',
          icon: isMember ? Icons.coffee_outlined : Icons.login,
          onTap: isMember ? onGoToCollection : () => onSignIn(),
        ),
        const SizedBox(height: 16),
        const _InfoCard(
          title: '기록은 계정에 자동 저장돼요',
          body: '다른 기기에서도 같은 Google 계정으로 이어서 볼 수 있어요.',
          icon: Icons.cloud_done_outlined,
        ),
      ],
    );
  }
}

class CollectionPage extends StatefulWidget {
  const CollectionPage({
    super.key,
    required this.isMember,
    required this.repository,
    required this.onSignIn,
  });
  final bool isMember;
  final BeanRepository repository;
  final Future<void> Function() onSignIn;

  @override
  State<CollectionPage> createState() => _CollectionPageState();
}

class _CollectionPageState extends State<CollectionPage> {
  late Future<List<BeanRecord>> _beans;

  @override
  void initState() {
    super.initState();
    _beans = widget.repository.listBeans();
  }

  void _reload() => setState(() => _beans = widget.repository.listBeans());

  Future<void> _openAddSheet() async {
    if (!widget.isMember) {
      await widget.onSignIn();
      return;
    }
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => AddBeanSheet(repository: widget.repository),
    );
    if (created == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '보관함',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _openAddSheet,
                    icon: const Icon(Icons.add_box_outlined),
                    tooltip: '원두 추가',
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                widget.isMember ? '내 원두' : '로그인하면 내 원두를 보관할 수 있어요.',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: const Color(0xFF746960),
                ),
              ),
              const SizedBox(height: 20),
              if (!widget.isMember)
                _SignInPrompt(onTap: widget.onSignIn)
              else
                FutureBuilder<List<BeanRecord>>(
                  future: _beans,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Padding(
                        padding: EdgeInsets.only(top: 56),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    if (snapshot.hasError) {
                      return _ErrorCard(onRetry: _reload);
                    }
                    final beans = snapshot.data ?? const [];
                    if (beans.isEmpty) {
                      return _EmptyBeans(onTap: _openAddSheet);
                    }
                    return Column(
                      children: [
                        for (final bean in beans)
                          _BeanTile(
                            bean: bean,
                            onTap: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => BeanDetailPage(
                                    beanId: bean.id,
                                    repository: widget.repository,
                                  ),
                                ),
                              );
                              _reload();
                            },
                          ),
                      ],
                    );
                  },
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: widget.isMember
          ? FloatingActionButton.extended(
              onPressed: _openAddSheet,
              icon: const Icon(Icons.add),
              label: const Text('원두 추가'),
            )
          : null,
    );
  }
}

class AddBeanSheet extends StatefulWidget {
  const AddBeanSheet({super.key, required this.repository});
  final BeanRepository repository;

  @override
  State<AddBeanSheet> createState() => _AddBeanSheetState();
}

class _AddBeanSheetState extends State<AddBeanSheet> {
  final _name = TextEditingController();
  final _weight = TextEditingController(text: '200');
  final _picker = ImagePicker();
  XFile? _labelPhoto;
  BeanLabelOcrResult? _ocrResult;
  var _saving = false;
  var _pickingPhoto = false;
  var _recognizing = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _weight.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final weight = double.tryParse(_weight.text);
    if (_name.text.trim().isEmpty || weight == null || weight < 0) {
      setState(() => _error = '원두 이름과 남은 양을 확인해주세요.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.addBean(
        name: _name.text.trim(),
        remainingWeightG: weight,
        labelPhoto: _labelPhoto,
      );
      if (mounted) {
        Navigator.pop(context, true);
      }
    } on PostgrestException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickPhoto(ImageSource source) async {
    setState(() {
      _pickingPhoto = true;
      _error = null;
    });
    try {
      final image = await _picker.pickImage(
        source: source,
        imageQuality: 78,
        maxWidth: 1800,
      );
      if (image != null && mounted) {
        HapticFeedback.selectionClick();
        setState(() {
          _labelPhoto = image;
          _ocrResult = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = '사진을 불러오지 못했어요. 권한을 확인하고 다시 시도해주세요.');
      }
    } finally {
      if (mounted) setState(() => _pickingPhoto = false);
    }
  }

  Future<void> _recognizeLabel() async {
    final photo = _labelPhoto;
    if (photo == null || _recognizing) return;
    setState(() {
      _recognizing = true;
      _error = null;
    });
    try {
      final result = await recognizeBeanLabelOnDevice(photo);
      if (mounted) setState(() => _ocrResult = result);
    } catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _recognizing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, keyboard + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '새 원두 추가',
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0EAE2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.photo_camera_outlined),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        '원두 봉투 사진',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    if (_labelPhoto != null)
                      TextButton(
                        onPressed: _pickingPhoto
                            ? null
                            : () => setState(() {
                                _labelPhoto = null;
                                _ocrResult = null;
                              }),
                        child: const Text('제거'),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  _labelPhoto == null
                      ? '촬영하거나 사진 보관함에서 불러올 수 있어요.'
                      : '사진이 선택됐어요. 원두를 저장하면 계정에 함께 보관돼요.',
                  style: const TextStyle(
                    color: Color(0xFF746960),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _pickingPhoto
                            ? null
                            : () => _pickPhoto(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: const Text('촬영'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _pickingPhoto
                            ? null
                            : () => _pickPhoto(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: Text(_pickingPhoto ? '불러오는 중...' : '사진 선택'),
                      ),
                    ),
                  ],
                ),
                if (_labelPhoto != null && !kIsWeb) ...[
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: _recognizing ? null : _recognizeLabel,
                    icon: const Icon(Icons.document_scanner_outlined),
                    label: Text(_recognizing ? '글자를 읽는 중...' : '사진에서 원두명 제안'),
                  ),
                ],
                if (_ocrResult != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.66),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '사진에서 찾은 원두명',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF746960),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _ocrResult!.beanName ?? '원두명을 확실히 찾지 못했어요.',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        if (_ocrResult!.beanName != null)
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                _name.text = _ocrResult!.beanName!;
                                HapticFeedback.selectionClick();
                              },
                              child: const Text('원두명에 적용'),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _name,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: '원두 이름',
              hintText: '예: 과테말라 안티구아',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,1}')),
            ],
            decoration: const InputDecoration(
              labelText: '남은 양 (g)',
              hintText: '200',
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                _error!,
                style: const TextStyle(color: Color(0xFFB33B42)),
              ),
            ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? '저장 중...' : '원두 추가'),
          ),
        ],
      ),
    );
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({
    super.key,
    required this.isMember,
    required this.email,
    required this.onSignIn,
    required this.onSignOut,
  });
  final bool isMember;
  final String? email;
  final Future<void> Function() onSignIn;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
      children: [
        Text(
          '마이페이지',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 24),
        _InfoCard(
          title: isMember ? 'Google 계정으로 연결됨' : '로그인이 필요해요',
          body: isMember
              ? (email ?? '연결된 계정')
              : '로그인하면 원두와 기록을 안전하게 보관할 수 있어요.',
          icon: Icons.person_outline,
        ),
        const SizedBox(height: 16),
        FilledButton.tonalIcon(
          onPressed: isMember ? onSignOut : onSignIn,
          icon: Icon(isMember ? Icons.logout : Icons.login),
          label: Text(isMember ? '로그아웃' : 'Google로 로그인'),
        ),
        const SizedBox(height: 28),
        Text(
          '앱 전환 상태',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'Flutter 앱에서 Supabase 로그인과 원두 저장을 먼저 전환했습니다. 브루잉 타이머와 푸시는 다음 단계에서 네이티브 기능으로 연결합니다.',
          style: TextStyle(color: Color(0xFF746960), height: 1.45),
        ),
      ],
    );
  }
}

class RecordPage extends StatefulWidget {
  const RecordPage({
    super.key,
    required this.isMember,
    required this.repository,
    required this.onSignIn,
  });
  final bool isMember;
  final BeanRepository repository;
  final Future<void> Function() onSignIn;

  @override
  State<RecordPage> createState() => _RecordPageState();
}

class _RecordPageState extends State<RecordPage> {
  String? _kind;
  var _selecting = false;
  final Set<String> _selected = {};
  late Future<List<CupRecord>> _cups;

  @override
  void initState() {
    super.initState();
    _cups = widget.repository.listCups();
  }

  void _reload() => setState(() => _cups = widget.repository.listCups());

  void _toggleSelection(CupRecord cup) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selected.contains(cup.id)) {
        _selected.remove(cup.id);
      } else if (_selected.length < 2) {
        _selected.add(cup.id);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('비교할 기록은 두 잔까지 고를 수 있어요.')),
        );
      }
    });
  }

  Future<void> _openComparison(List<CupRecord> cups) async {
    final selected = cups.where((cup) => _selected.contains(cup.id)).toList();
    if (selected.length != 2) return;
    await Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => ComparePage(cups: selected)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => _reload(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _selecting ? '비교할 기록 고르기' : '기록',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _selecting = !_selecting;
                        _selected.clear();
                      });
                    },
                    icon: Icon(_selecting ? Icons.close : Icons.compare_arrows),
                    label: Text(_selecting ? '취소' : '비교'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SegmentedButton<String?>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: null, label: Text('전체')),
                  ButtonSegment(value: 'home', label: Text('집에서')),
                  ButtonSegment(value: 'cafe', label: Text('카페')),
                ],
                selected: {_kind},
                onSelectionChanged: (selection) {
                  HapticFeedback.selectionClick();
                  setState(() => _kind = selection.first);
                },
              ),
              const SizedBox(height: 20),
              if (!widget.isMember)
                _SignInPrompt(onTap: widget.onSignIn)
              else
                FutureBuilder<List<CupRecord>>(
                  future: _cups,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Padding(
                        padding: EdgeInsets.only(top: 56),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    if (snapshot.hasError) {
                      return const _InfoCard(
                        title: '기록을 불러오지 못했어요',
                        body: '인터넷 연결과 로그인 상태를 확인해주세요.',
                        icon: Icons.cloud_off_outlined,
                      );
                    }
                    final cups = (snapshot.data ?? const [])
                        .where((cup) => _kind == null || cup.kind == _kind)
                        .toList();
                    if (cups.isEmpty) {
                      return const _InfoCard(
                        title: '아직 기록이 없어요',
                        body: '원두를 선택해 첫 브루잉을 기록해보세요.',
                        icon: Icons.menu_book_outlined,
                      );
                    }
                    return Column(
                      children: [
                        if (_selecting)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Text(
                              '${_selected.length}/2 선택됨',
                              style: const TextStyle(color: Color(0xFF746960)),
                            ),
                          ),
                        for (final cup in cups)
                          _CupTile(
                            cup: cup,
                            selected: _selected.contains(cup.id),
                            selecting: _selecting,
                            onTap: () => _selecting
                                ? _toggleSelection(cup)
                                : Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => CupDetailPage(cup: cup),
                                    ),
                                  ),
                          ),
                        if (_selecting) const SizedBox(height: 72),
                      ],
                    );
                  },
                ),
            ],
          ),
        ),
      ),
      bottomSheet: _selecting
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                child: FutureBuilder<List<CupRecord>>(
                  future: _cups,
                  builder: (context, snapshot) => FilledButton.icon(
                    onPressed: _selected.length == 2 && snapshot.hasData
                        ? () => _openComparison(snapshot.data!)
                        : null,
                    icon: const Icon(Icons.compare_arrows),
                    label: const Text('두 잔 비교하기'),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

class _CupTile extends StatelessWidget {
  const _CupTile({
    required this.cup,
    required this.selected,
    required this.selecting,
    required this.onTap,
  });
  final CupRecord cup;
  final bool selected;
  final bool selecting;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: selected
              ? Theme.of(context).colorScheme.primary
              : const Color(0xFFE5DDD5),
          width: selected ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          if (selecting)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(
                selected ? Icons.check_circle : Icons.circle_outlined,
                color: selected
                    ? Theme.of(context).colorScheme.primary
                    : const Color(0xFF9C9087),
              ),
            ),
          CircleAvatar(
            backgroundColor: const Color(0xFFF0EAE2),
            child: Icon(
              cup.kind == 'cafe'
                  ? Icons.storefront_outlined
                  : Icons.coffee_outlined,
              color: const Color(0xFF594F49),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cup.beanName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${_formatDate(cup.createdAt)} · ${cup.kind == 'cafe' ? '카페' : '홈 브루'}',
                  style: const TextStyle(color: Color(0xFF746960)),
                ),
                const SizedBox(height: 5),
                Text(
                  _recipeSummary(cup.recipe),
                  style: const TextStyle(color: Color(0xFF594F49)),
                ),
              ],
            ),
          ),
          if (!selecting)
            Icon(
              _satisfactionIcon(cup.satisfaction),
              color: _satisfactionColor(cup.satisfaction),
            ),
        ],
      ),
    ),
  );
}

class CupDetailPage extends StatelessWidget {
  const CupDetailPage({super.key, required this.cup});
  final CupRecord cup;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(cup.beanName)),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          '추출 기록',
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Text(
          _formatDate(cup.createdAt),
          style: const TextStyle(color: Color(0xFF746960)),
        ),
        const SizedBox(height: 24),
        _RecipeGrid(recipe: cup.recipe),
        const SizedBox(height: 24),
        _InfoCard(
          title: _satisfactionLabel(cup.satisfaction),
          body: cup.memo.isEmpty ? '남긴 메모가 없어요.' : cup.memo,
          icon: _satisfactionIcon(cup.satisfaction),
        ),
      ],
    ),
  );
}

class ComparePage extends StatelessWidget {
  const ComparePage({super.key, required this.cups});
  final List<CupRecord> cups;

  @override
  Widget build(BuildContext context) {
    final first = cups[0];
    final second = cups[1];
    final sameBean = first.beanId != null && first.beanId == second.beanId;
    return Scaffold(
      appBar: AppBar(title: const Text('두 잔 비교')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            sameBean ? '${first.beanName} 비교' : '서로 다른 두 잔',
            style: Theme.of(context).textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            sameBean ? '달라진 조건과 맛을 비교해요.' : '원두와 추출 조건의 차이를 한눈에 봐요.',
            style: const TextStyle(color: Color(0xFF746960)),
          ),
          const SizedBox(height: 24),
          _CompareHeader(first: first, second: second),
          const SizedBox(height: 24),
          Text(
            '달라진 추출값',
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          _CompareRow(
            label: '원두',
            first: first.beanName,
            second: second.beanName,
          ),
          _CompareRow(
            label: '원두량',
            first: _recipeDose(first.recipe),
            second: _recipeDose(second.recipe),
          ),
          _CompareRow(
            label: '물',
            first: _recipeWater(first.recipe),
            second: _recipeWater(second.recipe),
          ),
          _CompareRow(
            label: '온도',
            first: _recipeTemperature(first.recipe),
            second: _recipeTemperature(second.recipe),
          ),
          _CompareRow(
            label: '시간',
            first: _recipeTime(first.recipe),
            second: _recipeTime(second.recipe),
          ),
          const SizedBox(height: 24),
          Text(
            '맛의 차이',
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          _CompareTaste(cup: first, label: '이전 기록'),
          const SizedBox(height: 10),
          _CompareTaste(cup: second, label: '최근 기록'),
        ],
      ),
    );
  }
}

class _CompareHeader extends StatelessWidget {
  const _CompareHeader({required this.first, required this.second});
  final CupRecord first;
  final CupRecord second;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: _CompareCupLabel(cup: first, label: '첫 번째'),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: _CompareCupLabel(cup: second, label: '두 번째'),
      ),
    ],
  );
}

class _CompareCupLabel extends StatelessWidget {
  const _CompareCupLabel({required this.cup, required this.label});
  final CupRecord cup;
  final String label;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF746960))),
        const SizedBox(height: 5),
        Text(
          cup.beanName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          _formatDate(cup.createdAt),
          style: const TextStyle(fontSize: 12, color: Color(0xFF746960)),
        ),
      ],
    ),
  );
}

class _CompareRow extends StatelessWidget {
  const _CompareRow({
    required this.label,
    required this.first,
    required this.second,
  });
  final String label;
  final String first;
  final String second;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 15),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: Color(0xFFE5DDD5))),
    ),
    child: Row(
      children: [
        SizedBox(
          width: 68,
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(child: Text(first, textAlign: TextAlign.center)),
        const Icon(Icons.arrow_forward, size: 16, color: Color(0xFF746960)),
        Expanded(child: Text(second, textAlign: TextAlign.center)),
      ],
    ),
  );
}

class _CompareTaste extends StatelessWidget {
  const _CompareTaste({required this.cup, required this.label});
  final CupRecord cup;
  final String label;
  @override
  Widget build(BuildContext context) => _InfoCard(
    title: '$label · ${_satisfactionLabel(cup.satisfaction)}',
    body: cup.memo.isEmpty ? '남긴 메모가 없어요.' : cup.memo,
    icon: _satisfactionIcon(cup.satisfaction),
  );
}

class _RecipeGrid extends StatelessWidget {
  const _RecipeGrid({required this.recipe});
  final Map<String, dynamic> recipe;
  @override
  Widget build(BuildContext context) => GridView.count(
    crossAxisCount: 2,
    crossAxisSpacing: 10,
    mainAxisSpacing: 10,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    childAspectRatio: 1.9,
    children: [
      _RecipeMetric(label: '원두', value: _recipeDose(recipe)),
      _RecipeMetric(label: '물', value: _recipeWater(recipe)),
      _RecipeMetric(label: '온도', value: _recipeTemperature(recipe)),
      _RecipeMetric(label: '시간', value: _recipeTime(recipe)),
    ],
  );
}

class _RecipeMetric extends StatelessWidget {
  const _RecipeMetric({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFF0EAE2),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF746960))),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ],
    ),
  );
}

String _formatDate(DateTime date) =>
    '${date.month}월 ${date.day}일 ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
String _recipeDose(Map<String, dynamic> recipe) => '${recipe['doseG'] ?? '-'}g';
String _recipeWater(Map<String, dynamic> recipe) =>
    '${recipe['waterMl'] ?? '-'}ml';
String _recipeTemperature(Map<String, dynamic> recipe) =>
    '${recipe['temperatureC'] ?? '-'}°C';
String _recipeTime(Map<String, dynamic> recipe) {
  final seconds = recipe['totalTimeSec'];
  return seconds is num
      ? '${_formatSeconds(seconds.toInt()).replaceFirst(':', '분 ')}초'
      : '-';
}

String _recipeSummary(Map<String, dynamic> recipe) =>
    '${_recipeDose(recipe)} · ${_recipeWater(recipe)} · ${_recipeTemperature(recipe)}';
IconData _satisfactionIcon(String? satisfaction) => switch (satisfaction) {
  'loved' => Icons.sentiment_very_satisfied_outlined,
  'not_for_me' => Icons.sentiment_dissatisfied_outlined,
  _ => Icons.sentiment_satisfied_outlined,
};
Color _satisfactionColor(String? satisfaction) => switch (satisfaction) {
  'loved' => const Color(0xFF8B0C4B),
  'not_for_me' => const Color(0xFFB33B42),
  _ => const Color(0xFF594F49),
};
String _satisfactionLabel(String? satisfaction) => switch (satisfaction) {
  'loved' => '좋았어요',
  'not_for_me' => '아쉬웠어요',
  'good' => '괜찮았어요',
  _ => '맛 기록 없음',
};

class PlaceholderPage extends StatelessWidget {
  const PlaceholderPage({super.key, required this.title, required this.body});
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_awesome,
            size: 40,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF746960)),
          ),
        ],
      ),
    ),
  );
}

class _PrimaryCard extends StatelessWidget {
  const _PrimaryCard({
    required this.title,
    required this.body,
    required this.icon,
    required this.onTap,
  });
  final String title;
  final String body;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(28),
    child: Ink(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF2B2420),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFF594F49),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(body, style: const TextStyle(color: Color(0xFFE7DDD4))),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.white),
        ],
      ),
    ),
  );
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.body,
    required this.icon,
  });
  final String title;
  final String body;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xFFF0EAE2),
      borderRadius: BorderRadius.circular(24),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF594F49)),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                body,
                style: const TextStyle(color: Color(0xFF746960), height: 1.4),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _SignInPrompt extends StatelessWidget {
  const _SignInPrompt({required this.onTap});
  final Future<void> Function() onTap;
  @override
  Widget build(BuildContext context) => _PrimaryCard(
    title: 'Google 로그인',
    body: '로그인하면 나만의 보관함을 만들 수 있어요.',
    icon: Icons.login,
    onTap: () => onTap(),
  );
}

class _EmptyBeans extends StatelessWidget {
  const _EmptyBeans({required this.onTap});
  final Future<void> Function() onTap;
  @override
  Widget build(BuildContext context) => _InfoCard(
    title: '아직 보관한 원두가 없어요',
    body: '첫 원두를 추가하고 남은 양을 기록해보세요.',
    icon: Icons.inventory_2_outlined,
  );
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      const _InfoCard(
        title: '원두를 불러오지 못했어요',
        body: '인터넷 연결과 로그인 상태를 확인해주세요.',
        icon: Icons.cloud_off_outlined,
      ),
      TextButton(onPressed: onRetry, child: const Text('다시 시도')),
    ],
  );
}

class _BeanTile extends StatelessWidget {
  const _BeanTile({required this.bean, required this.onTap});
  final BeanRecord bean;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5DDD5)),
      ),
      child: Row(
        children: [
          _BeanPhoto(imageUri: bean.raw['image_uri'] as String?),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bean.name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${bean.remainingWeightG.toStringAsFixed(bean.remainingWeightG % 1 == 0 ? 0 : 1)}g 남음',
                  style: const TextStyle(color: Color(0xFF746960)),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Color(0xFF9C9087)),
        ],
      ),
    ),
  );
}

class _BeanPhoto extends StatelessWidget {
  const _BeanPhoto({required this.imageUri});
  final String? imageUri;

  @override
  Widget build(BuildContext context) {
    if (imageUri == null || imageUri!.isEmpty) {
      return const CircleAvatar(
        backgroundColor: Color(0xFFF0EAE2),
        child: Icon(Icons.coffee_outlined, color: Color(0xFF594F49)),
      );
    }
    return FutureBuilder<String?>(
      future: _resolveBeanImageUri(imageUri!),
      builder: (context, snapshot) {
        final url = snapshot.data;
        if (url == null) {
          return const CircleAvatar(
            backgroundColor: Color(0xFFF0EAE2),
            child: Icon(Icons.coffee_outlined, color: Color(0xFF594F49)),
          );
        }
        return ClipOval(
          child: Image.network(
            url,
            width: 40,
            height: 40,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => const CircleAvatar(
              backgroundColor: Color(0xFFF0EAE2),
              child: Icon(Icons.coffee_outlined, color: Color(0xFF594F49)),
            ),
          ),
        );
      },
    );
  }
}

Future<String?> _resolveBeanImageUri(String imageUri) async {
  const prefix = 'beanfold-storage://bean-labels/';
  if (!imageUri.startsWith(prefix)) return imageUri;
  final path = imageUri.substring(prefix.length);
  final result = await Supabase.instance.client.storage
      .from('bean-labels')
      .createSignedUrl(path, 60 * 60);
  return result;
}

class BeanRecord {
  const BeanRecord({
    required this.id,
    required this.name,
    required this.remainingWeightG,
    required this.initialWeightG,
    required this.state,
    required this.raw,
  });
  final String id;
  final String name;
  final double remainingWeightG;
  final double initialWeightG;
  final String state;
  final Map<String, dynamic> raw;
  factory BeanRecord.fromJson(Map<String, dynamic> json) => BeanRecord(
    id: json['id'] as String,
    name: json['name'] as String,
    remainingWeightG: (json['remaining_weight_g'] as num).toDouble(),
    initialWeightG:
        ((json['initial_weight_g'] ?? json['remaining_weight_g']) as num)
            .toDouble(),
    state: (json['state'] ?? 'unspecified') as String,
    raw: json,
  );
  Map<String, dynamic> toSnapshot() => {
    'id': id,
    'name': name,
    'roaster': raw['roaster'] ?? '',
    'country': raw['country'] ?? '',
    'region': raw['region'] ?? '',
    'farm': raw['farm'] ?? '',
    'variety': raw['variety'] ?? '',
    'process': raw['process'] ?? '',
    'altitude': raw['altitude'] ?? '',
    'roastDate': raw['roast_date'],
    'roastLevel': raw['roast_level'] ?? 'unknown',
    'initialWeightG': initialWeightG,
    'remainingWeightG': remainingWeightG,
    'storageType': raw['storage_type'] ?? '',
    'state': state,
    'tastingNotes': raw['tasting_notes'] ?? const [],
    'description': raw['description'] ?? '',
    'imageUri': raw['image_uri'],
    'createdAt': raw['created_at'],
    'updatedAt': raw['updated_at'],
  };
}

class BeanRepository {
  BeanRepository(this._client);
  final SupabaseClient _client;
  Future<List<BeanRecord>> listBeans() async {
    final user = _client.auth.currentUser;
    if (user == null) return const [];
    final rows = await _client
        .from('beans')
        .select()
        .eq('user_id', user.id)
        .neq('state', 'archived')
        .order('updated_at', ascending: false);
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(BeanRecord.fromJson)
        .toList();
  }

  Future<void> addBean({
    required String name,
    required double remainingWeightG,
    XFile? labelPhoto,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      throw const AuthException('원두를 저장하려면 Google 로그인이 필요해요.');
    }
    final now = DateTime.now().toUtc().toIso8601String();
    final id = 'bean_${DateTime.now().microsecondsSinceEpoch}';
    String? imageUri;
    String? objectPath;
    try {
      if (labelPhoto != null) {
        final upload = await _uploadBeanLabelPhoto(
          userId: user.id,
          beanId: id,
          photo: labelPhoto,
        );
        imageUri = upload.$1;
        objectPath = upload.$2;
      }
      await _client.from('beans').insert({
        'id': id,
        'user_id': user.id,
        'name': name,
        'remaining_weight_g': remainingWeightG,
        'initial_weight_g': remainingWeightG,
        'state': remainingWeightG == 0 ? 'finished' : 'unspecified',
        'image_uri': imageUri,
        'created_at': now,
        'updated_at': now,
      });
    } catch (_) {
      if (objectPath != null) {
        await _client.storage.from('bean-labels').remove([objectPath]);
      }
      rethrow;
    }
  }

  Future<(String, String)> _uploadBeanLabelPhoto({
    required String userId,
    required String beanId,
    required XFile photo,
  }) async {
    final bytes = await photo.readAsBytes();
    if (bytes.lengthInBytes > 7 * 1024 * 1024) {
      throw ArgumentError('사진은 7MB 이하로 선택해주세요.');
    }
    final mimeType = switch (photo.mimeType) {
      'image/png' => 'image/png',
      'image/webp' => 'image/webp',
      _ => 'image/jpeg',
    };
    final extension = mimeType == 'image/png'
        ? 'png'
        : mimeType == 'image/webp'
        ? 'webp'
        : 'jpg';
    final path = '$userId/bean-label-$beanId.$extension';
    await _client.storage
        .from('bean-labels')
        .uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: mimeType, upsert: false),
        );
    return ('beanfold-storage://bean-labels/$path', path);
  }

  Future<BeanRecord?> getBean(String beanId) async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final row = await _client
        .from('beans')
        .select()
        .eq('user_id', user.id)
        .eq('id', beanId)
        .maybeSingle();
    return row == null
        ? null
        : BeanRecord.fromJson(Map<String, dynamic>.from(row));
  }

  Future<Map<String, dynamic>?> latestRecipe(String beanId) async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final row = await _client
        .from('recipes')
        .select('recipe')
        .eq('user_id', user.id)
        .eq('bean_id', beanId)
        .eq('archived', false)
        .order('updated_at', ascending: false)
        .limit(1)
        .maybeSingle();
    if (row == null || row['recipe'] == null) return null;
    return Map<String, dynamic>.from(row['recipe'] as Map);
  }

  Future<Map<String, dynamic>> createDefaultRecipe(BeanRecord bean) async {
    final user = _client.auth.currentUser;
    if (user == null) throw const AuthException('레시피를 저장하려면 Google 로그인이 필요해요.');
    final now = DateTime.now().toUtc().toIso8601String();
    final id = 'recipe_${DateTime.now().microsecondsSinceEpoch}';
    final recipe = <String, dynamic>{
      'id': id,
      'beanId': bean.id,
      'type': 'guided',
      'name': '균형 잡힌 시작점',
      'source': 'BEANFOLD',
      'hotIce': 'hot',
      'doseG': 15,
      'waterMl': 240,
      'ratio': 16,
      'temperatureC': 92,
      'grindTarget': '중간 굵기',
      'grinder': '',
      'dripper': 'April Brewer',
      'filter': '',
      'waterProfile': '',
      'bloomSec': 40,
      'totalTimeSec': 160,
      'steps': [
        {
          'id': '$id-1',
          'order': 1,
          'action': 'bloom',
          'name': '뜸 들이기',
          'durationSec': 40,
          'waterDeltaMl': 40,
          'waterTotalMl': 40,
          'instruction': '전체 원두를 고르게 적시며 40ml까지 부어주세요.',
        },
        {
          'id': '$id-2',
          'order': 2,
          'action': 'pour',
          'name': '첫 번째 붓기',
          'durationSec': 45,
          'waterDeltaMl': 95,
          'waterTotalMl': 135,
          'instruction': '중앙에서 바깥쪽으로 천천히 135ml까지 부어주세요.',
        },
        {
          'id': '$id-3',
          'order': 3,
          'action': 'wait',
          'name': '잠시 기다리기',
          'durationSec': 27,
          'waterDeltaMl': 0,
          'waterTotalMl': 135,
          'instruction': '물이 내려가도록 기다리며 베드가 고르게 유지되는지 살펴보세요.',
        },
        {
          'id': '$id-4',
          'order': 4,
          'action': 'pour',
          'name': '마지막 붓기',
          'durationSec': 48,
          'waterDeltaMl': 105,
          'waterTotalMl': 240,
          'instruction': '부드럽게 원을 그리며 목표 물양까지 마무리하세요.',
        },
      ],
      'explanation': <String>[],
      'ruleVersion': 'flutter-v1',
      'createdAt': now,
      'updatedAt': now,
    };
    await _client.from('recipes').insert({
      'id': id,
      'user_id': user.id,
      'bean_id': bean.id,
      'recipe': recipe,
      'archived': false,
      'created_at': now,
      'updated_at': now,
    });
    return recipe;
  }

  Future<void> saveRecipe(Map<String, dynamic> recipe) async {
    final user = _client.auth.currentUser;
    if (user == null) throw const AuthException('레시피를 저장하려면 Google 로그인이 필요해요.');
    final now = DateTime.now().toUtc().toIso8601String();
    recipe['updatedAt'] = now;
    await _client.from('recipes').upsert({
      'id': recipe['id'],
      'user_id': user.id,
      'bean_id': recipe['beanId'],
      'recipe': recipe,
      'archived': false,
      'created_at': recipe['createdAt'] ?? now,
      'updated_at': now,
    });
  }

  Future<void> adjustInventory(BeanRecord bean, double remainingWeightG) async {
    final user = _client.auth.currentUser;
    if (user == null) throw const AuthException('재고를 저장하려면 Google 로그인이 필요해요.');
    final next = double.parse(remainingWeightG.toStringAsFixed(1));
    if (next < 0 || next > 10000) {
      throw ArgumentError('남은 양은 0g부터 10,000g까지 입력할 수 있어요.');
    }
    final delta = double.parse(
      (next - bean.remainingWeightG).toStringAsFixed(1),
    );
    if (delta == 0) return;
    final now = DateTime.now().toUtc().toIso8601String();
    await _client
        .from('beans')
        .update({
          'remaining_weight_g': next,
          'state': next == 0
              ? 'finished'
              : bean.state == 'finished'
              ? 'opened'
              : bean.state,
          'updated_at': now,
        })
        .eq('user_id', user.id)
        .eq('id', bean.id);
    await _client.from('inventory_events').insert({
      'id': 'inventory_${DateTime.now().microsecondsSinceEpoch}',
      'user_id': user.id,
      'bean_id': bean.id,
      'kind': 'adjustment',
      'delta_g': delta,
      'remaining_weight_g': next,
      'note': '',
      'created_at': now,
    });
  }

  Future<BrewSessionRecord> startBrew(
    BeanRecord bean,
    Map<String, dynamic> recipe,
  ) async {
    final user = _client.auth.currentUser;
    if (user == null) throw const AuthException('브루잉을 시작하려면 Google 로그인이 필요해요.');
    final stamp = DateTime.now();
    final id = 'brew_${stamp.microsecondsSinceEpoch}';
    final session = BrewSessionRecord(
      id: id,
      bean: bean,
      recipe: recipe,
      stepIndex: 0,
      status: 'active',
      startedAt: stamp.millisecondsSinceEpoch,
    );
    await _client.from('brew_sessions').insert({
      'id': id,
      'user_id': user.id,
      'bean_id': bean.id,
      'recipe_id': recipe['id'],
      'status': 'active',
      'recipe_snapshot': recipe,
      'bean_snapshot': bean.toSnapshot(),
      'started_at': session.startedAt,
      'step_index': 0,
      'step_started_at': session.startedAt,
      'paused_at': null,
      'paused_duration_ms': 0,
      'completed_at': null,
      'created_at': stamp.toUtc().toIso8601String(),
    });
    return session;
  }

  Future<void> updateBrewStep(
    BrewSessionRecord session,
    int stepIndex, {
    required bool paused,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    await _client
        .from('brew_sessions')
        .update({
          'status': paused ? 'paused' : 'active',
          'step_index': stepIndex,
          'step_started_at': DateTime.now().millisecondsSinceEpoch,
          'paused_at': paused ? DateTime.now().millisecondsSinceEpoch : null,
        })
        .eq('user_id', user.id)
        .eq('id', session.id);
  }

  Future<String> completeBrew(BrewSessionRecord session) async {
    final user = _client.auth.currentUser;
    if (user == null) throw const AuthException('브루잉을 완료하려면 Google 로그인이 필요해요.');
    final dose = (session.recipe['doseG'] as num).toDouble();
    final nextWeight = (session.bean.remainingWeightG - dose)
        .clamp(0, double.infinity)
        .toDouble();
    final now = DateTime.now();
    final nowIso = now.toUtc().toIso8601String();
    final cupId = 'cup_${now.microsecondsSinceEpoch}';
    await _client
        .from('brew_sessions')
        .update({
          'status': 'completed',
          'completed_at': now.millisecondsSinceEpoch,
        })
        .eq('user_id', user.id)
        .eq('id', session.id);
    await _client
        .from('beans')
        .update({
          'remaining_weight_g': nextWeight,
          'state': nextWeight == 0
              ? 'finished'
              : session.bean.state == 'unspecified'
              ? 'opened'
              : session.bean.state,
          'updated_at': nowIso,
        })
        .eq('user_id', user.id)
        .eq('id', session.bean.id);
    await _client.from('cups').insert({
      'id': cupId,
      'user_id': user.id,
      'brew_session_id': session.id,
      'bean_id': session.bean.id,
      'kind': 'home',
      'bean_name': session.bean.name,
      'bean_snapshot': session.bean.toSnapshot(),
      'recipe_snapshot': session.recipe,
      'flavor_tags': <String>[],
      'taste': <String, dynamic>{},
      'memo': '',
      'cafe_name': '',
      'drink_name': '',
      'created_at': nowIso,
      'updated_at': nowIso,
    });
    await _client.from('inventory_events').insert({
      'id': 'inventory_${now.microsecondsSinceEpoch}',
      'user_id': user.id,
      'bean_id': session.bean.id,
      'cup_id': cupId,
      'kind': 'brew',
      'delta_g': -dose,
      'remaining_weight_g': nextWeight,
      'note': '',
      'created_at': nowIso,
    });
    return cupId;
  }

  Future<void> saveTaste({
    required String cupId,
    required String satisfaction,
    required String memo,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      throw const AuthException('맛 기록을 저장하려면 Google 로그인이 필요해요.');
    }
    await _client
        .from('cups')
        .update({
          'satisfaction': satisfaction,
          'memo': memo.trim(),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('user_id', user.id)
        .eq('id', cupId);
  }

  Future<List<CupRecord>> listCups({String? kind}) async {
    final user = _client.auth.currentUser;
    if (user == null) return const [];
    var query = _client.from('cups').select().eq('user_id', user.id);
    if (kind != null) {
      query = query.eq('kind', kind);
    }
    final rows = await query.order('created_at', ascending: false);
    return (rows as List)
        .cast<Map<String, dynamic>>()
        .map(CupRecord.fromJson)
        .toList();
  }
}

class CupRecord {
  const CupRecord({
    required this.id,
    required this.beanId,
    required this.beanName,
    required this.kind,
    required this.satisfaction,
    required this.memo,
    required this.createdAt,
    required this.recipe,
    required this.taste,
  });

  final String id;
  final String? beanId;
  final String beanName;
  final String kind;
  final String? satisfaction;
  final String memo;
  final DateTime createdAt;
  final Map<String, dynamic> recipe;
  final Map<String, dynamic> taste;

  factory CupRecord.fromJson(Map<String, dynamic> json) => CupRecord(
    id: json['id'] as String,
    beanId: json['bean_id'] as String?,
    beanName: (json['bean_name'] ?? '이름 없는 커피') as String,
    kind: (json['kind'] ?? 'home') as String,
    satisfaction: json['satisfaction'] as String?,
    memo: (json['memo'] ?? '') as String,
    createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    recipe: _jsonMap(json['recipe_snapshot']),
    taste: _jsonMap(json['taste']),
  );
}

Map<String, dynamic> _jsonMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

class BrewSessionRecord {
  const BrewSessionRecord({
    required this.id,
    required this.bean,
    required this.recipe,
    required this.stepIndex,
    required this.status,
    required this.startedAt,
  });
  final String id;
  final BeanRecord bean;
  final Map<String, dynamic> recipe;
  final int stepIndex;
  final String status;
  final int startedAt;
}

class BeanDetailPage extends StatefulWidget {
  const BeanDetailPage({
    super.key,
    required this.beanId,
    required this.repository,
  });
  final String beanId;
  final BeanRepository repository;
  @override
  State<BeanDetailPage> createState() => _BeanDetailPageState();
}

class _BeanDetailPageState extends State<BeanDetailPage> {
  late Future<_BeanDetailData?> _data;
  @override
  void initState() {
    super.initState();
    _data = _load();
  }

  Future<_BeanDetailData?> _load() async {
    final bean = await widget.repository.getBean(widget.beanId);
    if (bean == null) return null;
    return _BeanDetailData(bean, await widget.repository.latestRecipe(bean.id));
  }

  void _reload() => setState(() => _data = _load());

  Future<void> _adjust(BeanRecord bean) async {
    final value = await showDialog<double>(
      context: context,
      builder: (_) => InventoryDialog(current: bean.remainingWeightG),
    );
    if (value == null) return;
    try {
      await widget.repository.adjustInventory(bean, value);
      _reload();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _start(
    BeanRecord bean,
    Map<String, dynamic>? currentRecipe,
  ) async {
    try {
      final recipe =
          currentRecipe ?? await widget.repository.createDefaultRecipe(bean);
      final session = await widget.repository.startBrew(bean, recipe);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              BrewTimerPage(repository: widget.repository, session: session),
        ),
      );
      _reload();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _editRecipe(
    BeanRecord bean,
    Map<String, dynamic>? currentRecipe,
  ) async {
    try {
      final recipe =
          currentRecipe ?? await widget.repository.createDefaultRecipe(bean);
      if (!mounted) return;
      final saved = await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => RecipeEditorPage(
            repository: widget.repository,
            recipe: Map<String, dynamic>.from(recipe),
          ),
        ),
      );
      if (saved == true) _reload();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      backgroundColor: const Color(0xFFF8F4EE),
      title: const Text('원두 상세'),
      centerTitle: true,
    ),
    body: FutureBuilder<_BeanDetailData?>(
      future: _data,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final data = snapshot.data;
        if (data == null) return const Center(child: Text('원두를 찾지 못했어요.'));
        final bean = data.bean;
        final recipe = data.recipe;
        return ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
          children: [
            Text(
              bean.name,
              style: Theme.of(context).textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              '${bean.raw['country'] ?? ''} ${bean.raw['process'] ?? ''}'
                      .trim()
                      .isEmpty
                  ? '직접 등록한 원두'
                  : '${bean.raw['country'] ?? ''} · ${bean.raw['process'] ?? ''}',
              style: const TextStyle(color: Color(0xFF746960)),
            ),
            const SizedBox(height: 24),
            _InfoCard(
              title:
                  '${bean.remainingWeightG.toStringAsFixed(bean.remainingWeightG % 1 == 0 ? 0 : 1)}g 남음',
              body:
                  '처음 ${bean.initialWeightG.toStringAsFixed(bean.initialWeightG % 1 == 0 ? 0 : 1)}g에서 남은 양이에요.',
              icon: Icons.inventory_2_outlined,
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () => _adjust(bean),
              icon: const Icon(Icons.tune),
              label: const Text('재고 맞추기'),
            ),
            const SizedBox(height: 30),
            Text(
              '오늘의 레시피',
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            if (recipe == null)
              _InfoCard(
                title: '균형 잡힌 시작점을 만들어요',
                body: '15g · 240ml · 92°C · 2분 40초',
                icon: Icons.auto_awesome,
              )
            else
              _RecipeCard(recipe: recipe),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _editRecipe(bean, recipe),
              icon: const Icon(Icons.tune),
              label: const Text('직접 조절'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => _start(bean, recipe),
              icon: const Icon(Icons.play_arrow),
              label: Text(recipe == null ? '추천 레시피 만들고 내리기' : '이 레시피로 내리기'),
            ),
          ],
        );
      },
    ),
  );
}

class _BeanDetailData {
  const _BeanDetailData(this.bean, this.recipe);
  final BeanRecord bean;
  final Map<String, dynamic>? recipe;
}

class InventoryDialog extends StatefulWidget {
  const InventoryDialog({super.key, required this.current});
  final double current;
  @override
  State<InventoryDialog> createState() => _InventoryDialogState();
}

class _InventoryDialogState extends State<InventoryDialog> {
  late final TextEditingController _controller;
  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.current.toStringAsFixed(widget.current % 1 == 0 ? 0 : 1),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('재고 맞추기'),
    content: TextField(
      controller: _controller,
      autofocus: true,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,1}')),
      ],
      decoration: const InputDecoration(suffixText: 'g'),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('취소'),
      ),
      FilledButton(
        onPressed: () =>
            Navigator.pop(context, double.tryParse(_controller.text)),
        child: const Text('저장'),
      ),
    ],
  );
}

class _RecipeCard extends StatelessWidget {
  const _RecipeCard({required this.recipe});
  final Map<String, dynamic> recipe;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: const Color(0xFFE5DDD5)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          recipe['name'] as String,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 7),
        Text(
          '${recipe['doseG']}g · ${recipe['waterMl']}ml · ${recipe['temperatureC']}°C · ${_formatSeconds(recipe['totalTimeSec'] as int)}',
          style: const TextStyle(color: Color(0xFF746960)),
        ),
        const SizedBox(height: 14),
        for (final step in (recipe['steps'] as List))
          Padding(
            padding: const EdgeInsets.only(bottom: 7),
            child: Text(
              '${step['order']}. ${step['name']} · ${step['durationSec']}초',
            ),
          ),
      ],
    ),
  );
}

class RecipeEditorPage extends StatefulWidget {
  const RecipeEditorPage({
    super.key,
    required this.repository,
    required this.recipe,
  });
  final BeanRepository repository;
  final Map<String, dynamic> recipe;
  @override
  State<RecipeEditorPage> createState() => _RecipeEditorPageState();
}

class _RecipeEditorPageState extends State<RecipeEditorPage> {
  late final TextEditingController _dose;
  late final TextEditingController _water;
  late final TextEditingController _temperature;
  late final TextEditingController _time;
  var _saving = false;
  @override
  void initState() {
    super.initState();
    _dose = TextEditingController(text: '${widget.recipe['doseG']}');
    _water = TextEditingController(text: '${widget.recipe['waterMl']}');
    _temperature = TextEditingController(
      text: '${widget.recipe['temperatureC']}',
    );
    _time = TextEditingController(text: '${widget.recipe['totalTimeSec']}');
  }

  @override
  void dispose() {
    _dose.dispose();
    _water.dispose();
    _temperature.dispose();
    _time.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final dose = double.tryParse(_dose.text);
    final water = double.tryParse(_water.text);
    final temp = int.tryParse(_temperature.text);
    final total = int.tryParse(_time.text);
    if (dose == null ||
        water == null ||
        temp == null ||
        total == null ||
        dose <= 0 ||
        water <= 0 ||
        temp < 60 ||
        temp > 100 ||
        total < 60) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('원두, 물, 온도와 시간을 다시 확인해주세요.')),
      );
      return;
    }
    final recipe = widget.recipe;
    final bloom = (water * 0.17).round();
    final first = (water * 0.56).round();
    final bloomSec = (recipe['bloomSec'] as num).toInt();
    final pourOne = (total * 0.28).round().clamp(30, 60);
    final wait = 27;
    final finalPour = (total - bloomSec - pourOne - wait).clamp(30, 90);
    recipe['doseG'] = dose;
    recipe['waterMl'] = water;
    recipe['ratio'] = double.parse((water / dose).toStringAsFixed(1));
    recipe['temperatureC'] = temp;
    recipe['totalTimeSec'] = total;
    recipe['steps'] = [
      {
        'id': '${recipe['id']}-1',
        'order': 1,
        'action': 'bloom',
        'name': '뜸 들이기',
        'durationSec': bloomSec,
        'waterDeltaMl': bloom,
        'waterTotalMl': bloom,
        'instruction': '전체 원두를 고르게 적시며 ${bloom}ml까지 부어주세요.',
      },
      {
        'id': '${recipe['id']}-2',
        'order': 2,
        'action': 'pour',
        'name': '첫 번째 붓기',
        'durationSec': pourOne,
        'waterDeltaMl': first - bloom,
        'waterTotalMl': first,
        'instruction': '중앙에서 바깥쪽으로 천천히 ${first}ml까지 부어주세요.',
      },
      {
        'id': '${recipe['id']}-3',
        'order': 3,
        'action': 'wait',
        'name': '잠시 기다리기',
        'durationSec': wait,
        'waterDeltaMl': 0,
        'waterTotalMl': first,
        'instruction': '물이 내려가도록 기다리며 베드를 살펴보세요.',
      },
      {
        'id': '${recipe['id']}-4',
        'order': 4,
        'action': 'pour',
        'name': '마지막 붓기',
        'durationSec': finalPour,
        'waterDeltaMl': water - first,
        'waterTotalMl': water,
        'instruction': '부드럽게 원을 그리며 목표 물양까지 마무리하세요.',
      },
    ];
    setState(() => _saving = true);
    try {
      await widget.repository.saveRecipe(recipe);
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    String suffix = '',
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,1}')),
      ],
      decoration: InputDecoration(labelText: label, suffixText: suffix),
    ),
  );
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('레시피 직접 조절'), centerTitle: true),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        children: [
          Text(
            '추출 시작점을 내 취향에 맞춰 조절해요.',
            style: Theme.of(context).textTheme.bodyLarge
                ?.copyWith(color: const Color(0xFF746960)),
          ),
          const SizedBox(height: 26),
          _field('원두', _dose, suffix: 'g'),
          _field('물', _water, suffix: 'ml'),
          _field('온도', _temperature, suffix: '°C'),
          _field('전체 시간', _time, suffix: '초'),
          const SizedBox(height: 12),
          const _InfoCard(
            title: '단계는 자동으로 맞춰져요',
            body: '변경한 물양과 시간에 맞춰 뜸, 붓기, 기다리기 단계가 다시 계산됩니다.',
            icon: Icons.auto_awesome,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? '저장 중...' : '레시피 저장'),
          ),
        ],
      ),
    ),
  );
}

class BrewTimerPage extends StatefulWidget {
  const BrewTimerPage({
    super.key,
    required this.repository,
    required this.session,
  });
  final BeanRepository repository;
  final BrewSessionRecord session;
  @override
  State<BrewTimerPage> createState() => _BrewTimerPageState();
}

class _BrewTimerPageState extends State<BrewTimerPage> {
  late final List<Map<String, dynamic>> _steps;
  Timer? _timer;
  var _stepIndex = 0;
  var _remaining = 0;
  var _paused = false;
  var _finishing = false;
  @override
  void initState() {
    super.initState();
    _steps = (widget.session.recipe['steps'] as List)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    _remaining = (_steps.first['durationSec'] as num).toInt();
    _startTicking();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTicking() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!_paused && mounted) {
        setState(() {
          if (_remaining > 0) _remaining--;
        });
      }
    });
  }

  Future<void> _next() async {
    if (_stepIndex >= _steps.length - 1) {
      await _complete();
      return;
    }
    final next = _stepIndex + 1;
    setState(() {
      _stepIndex = next;
      _remaining = (_steps[next]['durationSec'] as num).toInt();
    });
    await widget.repository.updateBrewStep(widget.session, next, paused: false);
    HapticFeedback.mediumImpact();
  }

  Future<void> _togglePause() async {
    setState(() => _paused = !_paused);
    await widget.repository.updateBrewStep(
      widget.session,
      _stepIndex,
      paused: _paused,
    );
    HapticFeedback.selectionClick();
  }

  Future<void> _complete() async {
    setState(() => _finishing = true);
    try {
      final cupId = await widget.repository.completeBrew(widget.session);
      if (mounted) {
        await Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => TasteRecordPage(
              repository: widget.repository,
              cupId: cupId,
              beanName: widget.session.bean.name,
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _finishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final step = _steps[_stepIndex];
    final total = (step['durationSec'] as num).toInt();
    final progress = total == 0 ? 1.0 : 1 - (_remaining / total);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back),
                  ),
                  Expanded(
                    child: Text(
                      widget.session.bean.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
              const Spacer(),
              Text(
                '${_stepIndex + 1} / ${_steps.length}',
                style: const TextStyle(color: Color(0xFF746960)),
              ),
              const SizedBox(height: 16),
              Text(
                step['name'] as String,
                style: Theme.of(context).textTheme.headlineMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              Text(
                step['instruction'] as String,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF746960), height: 1.45),
              ),
              const SizedBox(height: 34),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: progress),
                duration: const Duration(milliseconds: 350),
                builder: (context, value, _) => SizedBox(
                  width: 244,
                  height: 244,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: value,
                        strokeWidth: 10,
                        backgroundColor: const Color(0xFFE9E1D9),
                      ),
                      Text(
                        _formatSeconds(_remaining),
                        style: Theme.of(context).textTheme.displayLarge
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                (step['waterDeltaMl'] as num) > 0
                    ? '${step['waterTotalMl']}ml까지 물을 부어요'
                    : '물을 기다려요',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _finishing ? null : _togglePause,
                      icon: Icon(_paused ? Icons.play_arrow : Icons.pause),
                      label: Text(_paused ? '다시 시작' : '일시정지'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _finishing ? null : _next,
                      icon: Icon(
                        _stepIndex == _steps.length - 1
                            ? Icons.check
                            : Icons.skip_next,
                      ),
                      label: Text(
                        _stepIndex == _steps.length - 1
                            ? (_finishing ? '기록 중...' : '브루잉 완료')
                            : '다음 단계',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TasteRecordPage extends StatefulWidget {
  const TasteRecordPage({
    super.key,
    required this.repository,
    required this.cupId,
    required this.beanName,
  });
  final BeanRepository repository;
  final String cupId;
  final String beanName;
  @override
  State<TasteRecordPage> createState() => _TasteRecordPageState();
}

class _TasteRecordPageState extends State<TasteRecordPage> {
  String _satisfaction = 'good';
  final _memo = TextEditingController();
  var _saving = false;
  @override
  void dispose() {
    _memo.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await widget.repository.saveTaste(
        cupId: widget.cupId,
        satisfaction: _satisfaction,
        memo: _memo.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('맛 기록을 저장했어요.')));
        Navigator.pop(context);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '방금 내린\n${widget.beanName}',
              style: Theme.of(context).textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            const Text(
              '첫 느낌이 어떠셨나요?',
              style: TextStyle(color: Color(0xFF746960)),
            ),
            const SizedBox(height: 28),
            Row(
              children: [
                for (final option in const [
                  (
                    'not_for_me',
                    '아쉬웠어요',
                    Icons.sentiment_dissatisfied_outlined,
                  ),
                  ('good', '괜찮았어요', Icons.sentiment_satisfied_outlined),
                  ('loved', '좋았어요', Icons.sentiment_very_satisfied_outlined),
                ])
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(option.$3),
                            const SizedBox(height: 5),
                            Text(option.$2),
                          ],
                        ),
                        selected: _satisfaction == option.$1,
                        onSelected: (_) {
                          HapticFeedback.selectionClick();
                          setState(() => _satisfaction = option.$1);
                        },
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 28),
            TextField(
              controller: _memo,
              minLines: 4,
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: '한 줄 메모',
                hintText: '예: 식으니 단맛이 더 잘 느껴졌어요.',
              ),
            ),
            const Spacer(),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? '저장 중...' : '맛 기록 저장'),
            ),
          ],
        ),
      ),
    ),
  );
}

String _formatSeconds(int seconds) =>
    '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
