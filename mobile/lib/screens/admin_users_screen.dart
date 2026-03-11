import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final List<Map<String, dynamic>> _users = [
    {'id': 1, 'fullName': 'John Doe', 'email': 'john.doe@example.com', 'phoneNumber': '+628123456789', 'role': 'user', 'createdAt': '2024-01-15'},
    {'id': 2, 'fullName': 'Admin User', 'email': 'admin@skyintern.com', 'phoneNumber': '+628987654321', 'role': 'admin', 'createdAt': '2024-01-10'},
    {'id': 3, 'fullName': 'Budi Santoso', 'email': 'budi@email.com', 'phoneNumber': '+628111222333', 'role': 'user', 'createdAt': '2024-02-01'},
  ];
  String _selectedRole = 'all';

  List<Map<String, dynamic>> get _filteredUsers =>
      _selectedRole == 'all' ? _users : _users.where((u) => u['role'] == _selectedRole).toList();

  int get _totalAdmins => _users.where((u) => u['role'] == 'admin').length;
  int get _totalUsers => _users.where((u) => u['role'] == 'user').length;

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
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: _showAddEditDialog,
                    icon: const Icon(Icons.person_add_rounded, size: 18),
                    label: const Text('Tambah'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0D9488),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
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
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filteredUsers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final u = _filteredUsers[i];
                      return TweenAnimationBuilder<double>(
                        duration: Duration(milliseconds: 280 + i * 55),
                        tween: Tween(begin: 0.0, end: 1.0),
                        curve: Curves.easeOut,
                        builder: (_, v, child) => Opacity(opacity: v,
                            child: Transform.translate(offset: Offset(0, 18 * (1 - v)), child: child)),
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: u['role'] == 'admin'
                                    ? const Color(0xFF6366F1)
                                    : AppColors.primary,
                                radius: 22,
                                child: Text(
                                  (u['fullName'] as String).isNotEmpty ? (u['fullName'] as String)[0].toUpperCase() : '?',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(u['fullName'],
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: (u['role'] == 'admin' ? const Color(0xFF6366F1) : AppColors.primary).withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            u['role'] == 'admin' ? 'Admin' : 'User',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: u['role'] == 'admin' ? const Color(0xFF6366F1) : AppColors.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(u['email'],
                                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    if (u['phoneNumber'] != null) ...[
                                      const SizedBox(height: 1),
                                      Text(u['phoneNumber'],
                                          style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                                    ],
                                  ],
                                ),
                              ),
                              PopupMenuButton<String>(
                                icon: const Icon(Icons.more_vert_rounded, color: AppColors.textHint),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                itemBuilder: (_) => [
                                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18, color: AppColors.primary), SizedBox(width: 10), Text('Edit')])),
                                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_rounded, size: 18, color: AppColors.error), SizedBox(width: 10), Text('Hapus', style: TextStyle(color: AppColors.error))])),
                                ],
                                onSelected: (v) {
                                  if (v == 'edit') _showAddEditDialog(user: u);
                                  else _showDeleteDialog(u);
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
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

  void _showAddEditDialog({Map<String, dynamic>? user}) {
    final isEdit = user != null;
    final nameCtrl = TextEditingController(text: user?['fullName'] ?? '');
    final emailCtrl = TextEditingController(text: user?['email'] ?? '');
    final phoneCtrl = TextEditingController(text: user?['phoneNumber'] ?? '');
    String role = user?['role'] ?? 'user';
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (sCtx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF0D9488), Color(0xFF6366F1)]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(isEdit ? Icons.edit_rounded : Icons.person_add_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Text(isEdit ? 'Edit Pengguna' : 'Tambah Pengguna',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InputField(label: 'Nama Lengkap', controller: nameCtrl,
                      validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
                  const SizedBox(height: 14),
                  InputField(label: 'Email', controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
                  const SizedBox(height: 14),
                  InputField(label: 'Nomor Telepon', controller: phoneCtrl,
                      keyboardType: TextInputType.phone),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: role,
                    decoration: InputDecoration(
                      labelText: 'Role',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'user', child: Text('Pengguna')),
                      DropdownMenuItem(value: 'admin', child: Text('Administrator')),
                    ],
                    onChanged: (v) => setSt(() => role = v!),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx),
                child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
            ElevatedButton(
              onPressed: () {
                if (!formKey.currentState!.validate()) return;
                if (isEdit) {
                  setState(() {
                    final idx = _users.indexWhere((u) => u['id'] == user!['id']);
                    if (idx != -1) {
                      _users[idx] = {...user!, 'fullName': nameCtrl.text, 'email': emailCtrl.text, 'phoneNumber': phoneCtrl.text, 'role': role};
                    }
                  });
                } else {
                  setState(() => _users.add({'id': _users.length + 1, 'fullName': nameCtrl.text, 'email': emailCtrl.text, 'phoneNumber': phoneCtrl.text, 'role': role, 'createdAt': DateTime.now().toString().split(' ')[0]}));
                }
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text('Pengguna berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!'),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ));
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0D9488),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text(isEdit ? 'Perbarui' : 'Tambah'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Pengguna', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Anda yakin ingin menghapus "${user['fullName']}"?',
            style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () {
              setState(() => _users.removeWhere((u) => u['id'] == user['id']));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text('Pengguna berhasil dihapus'),
                backgroundColor: AppColors.error,
                behavior: SnackBarBehavior.floating,
              ));
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}

