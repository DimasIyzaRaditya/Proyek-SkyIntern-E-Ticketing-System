import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../services/admin_service.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;
  String? _error;
  String _selectedRole = 'all';

  List<Map<String, dynamic>> get _filteredUsers => _selectedRole == 'all'
      ? _users
      : _users.where((u) => (u['role'] as String?)?.toLowerCase() == _selectedRole).toList();

  int get _totalAdmins => _users.where((u) => (u['role'] as String?)?.toLowerCase() == 'admin').length;
  int get _totalUsers => _users.where((u) => (u['role'] as String?)?.toLowerCase() == 'user').length;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final data = await AdminService.getUsers();
      if (mounted) setState(() { _users = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF0D9488), Color(0xFF6366F1)]),
            boxShadow: [BoxShadow(color: Color(0x220D9488), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Pengguna', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                onPressed: _loadUsers,
                tooltip: 'Refresh',
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(_error!, textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.textSecondary)),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadUsers,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
              : Column(
        children: [
          // Stats row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: StatCard(
                    icon: Icons.group_rounded,
                    value: '${_users.length}',
                    label: 'Total',
                    gradient: const LinearGradient(colors: [Color(0xFF0D9488), Color(0xFF6366F1)]),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    icon: Icons.person_rounded,
                    value: '$_totalUsers',
                    label: 'Pengguna',
                    gradient: AppColors.primaryGradient,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    icon: Icons.admin_panel_settings_rounded,
                    value: '$_totalAdmins',
                    label: 'Admin',
                    gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Filter chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _filterChip('Semua', 'all'),
                const SizedBox(width: 8),
                _filterChip('Pengguna', 'user'),
                const SizedBox(width: 8),
                _filterChip('Admin', 'admin'),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // User list
          Expanded(
            child: _filteredUsers.isEmpty
                ? const EmptyState(icon: Icons.group_off_rounded, title: 'Tidak ada pengguna', subtitle: 'Belum ada pengguna di kategori ini')
                : RefreshIndicator(
                    onRefresh: _loadUsers,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredUsers.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, i) {
                        final u = _filteredUsers[i];
                        final isBlocked = u['isBlocked'] == true;
                        return TweenAnimationBuilder<double>(
                          duration: Duration(milliseconds: 280 + i * 55),
                          tween: Tween(begin: 0.0, end: 1.0),
                          curve: Curves.easeOut,
                          builder: (_, v, child) => Opacity(opacity: v,
                              child: Transform.translate(offset: Offset(0, 18 * (1 - v)), child: child)),
                          child: Opacity(
                            opacity: isBlocked ? 0.7 : 1.0,
                            child: GlassCard(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              child: Row(
                                children: [
                                  Stack(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: (u['role'] as String?)?.toLowerCase() == 'admin'
                                            ? const Color(0xFF6366F1)
                                            : AppColors.primary,
                                        radius: 22,
                                        child: Text(
                                          (u['name'] as String? ?? '?').isNotEmpty
                                              ? (u['name'] as String)[0].toUpperCase()
                                              : '?',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      if (isBlocked)
                                        Positioned(
                                          bottom: 0, right: 0,
                                          child: Container(
                                            width: 14, height: 14,
                                            decoration: const BoxDecoration(
                                              color: AppColors.error,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(Icons.block_rounded, size: 10, color: Colors.white),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(u['name'] ?? '',
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
                                            ),
                                            if (isBlocked)
                                              Container(
                                                margin: const EdgeInsets.only(right: 6),
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: AppColors.error.withValues(alpha: 0.12),
                                                  borderRadius: BorderRadius.circular(20),
                                                ),
                                                child: const Text('Diblokir',
                                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.error)),
                                              ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: ((u['role'] as String?)?.toLowerCase() == 'admin' ? const Color(0xFF6366F1) : AppColors.primary).withValues(alpha: 0.12),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                (u['role'] as String?)?.toLowerCase() == 'admin' ? 'Admin' : 'User',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: (u['role'] as String?)?.toLowerCase() == 'admin' ? const Color(0xFF6366F1) : AppColors.primary,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(u['email'] ?? '',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        if (u['phone'] != null && u['phone'].toString().isNotEmpty) ...[
                                          const SizedBox(height: 1),
                                          Text(u['phone'].toString(),
                                              style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                                        ],
                                      ],
                                    ),
                                  ),
                                  PopupMenuButton<String>(
                                    icon: const Icon(Icons.more_vert_rounded, color: AppColors.textHint),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    itemBuilder: (_) => [
                                      PopupMenuItem(
                                        value: 'block',
                                        child: Row(children: [
                                          Icon(
                                            isBlocked ? Icons.lock_open_rounded : Icons.block_rounded,
                                            size: 18,
                                            color: isBlocked ? AppColors.success : AppColors.error,
                                          ),
                                          const SizedBox(width: 10),
                                          Text(
                                            isBlocked ? 'Buka Blokir' : 'Blokir',
                                            style: TextStyle(color: isBlocked ? AppColors.success : AppColors.error),
                                          ),
                                        ]),
                                      ),
                                    ],
                                    onSelected: (v) {
                                      if (v == 'block') _toggleBlock(u);
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    final selected = _selectedRole == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          gradient: selected ? const LinearGradient(colors: [Color(0xFF0D9488), Color(0xFF6366F1)]) : null,
          color: selected ? null : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? Colors.transparent : AppColors.border),
          boxShadow: selected ? AppShadows.soft : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Future<void> _toggleBlock(Map<String, dynamic> user) async {
    final isBlocked = user['isBlocked'] == true;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(isBlocked ? 'Buka Blokir Pengguna' : 'Blokir Pengguna',
            style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
          isBlocked
              ? 'Anda yakin ingin membuka blokir akun "${user['name']}"?'
              : 'Anda yakin ingin memblokir akun "${user['name']}"? Pengguna tidak dapat login setelah diblokir.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: isBlocked ? AppColors.success : AppColors.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text(isBlocked ? 'Buka Blokir' : 'Blokir'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final nowBlocked = await AdminService.blockUser(user['id']);
      setState(() {
        final idx = _users.indexWhere((u) => u['id'] == user['id']);
        if (idx != -1) _users[idx] = {..._users[idx], 'isBlocked': nowBlocked};
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(nowBlocked ? 'Akun berhasil diblokir' : 'Blokir akun berhasil dibuka'),
          backgroundColor: nowBlocked ? AppColors.error : AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }
}
