import 'package:flutter/material.dart';

// ─── Color Palette — Modern Minimalist ───────────────────────────────────────
class AppColors {
  // ── Primary Brand Blue ─────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF2563EB); // blue-600
  static const Color primaryDark  = Color(0xFF1E40AF); // blue-800
  static const Color primaryLight = Color(0xFFEFF6FF); // blue-50 (tint chips)

  // ── Secondary — slate indigo ───────────────────────────────────────────────
  static const Color secondary     = Color(0xFF1E40AF);
  static const Color secondaryDark = Color(0xFF1E3A5F);

  // ── Accent ────────────────────────────────────────────────────────────────
  static const Color accent      = Color(0xFF38BDF8); // sky-400
  static const Color accentLight = Color(0xFFE0F2FE); // sky-100

  // ── Status ────────────────────────────────────────────────────────────────
  static const Color success      = Color(0xFF10B981); // emerald-500
  static const Color successLight = Color(0xFFECFDF5); // emerald-50
  static const Color error        = Color(0xFFEF4444); // red-500
  static const Color errorLight   = Color(0xFFFEF2F2); // red-50
  static const Color warning      = Color(0xFFF59E0B); // amber-500
  static const Color warningLight = Color(0xFFFFFBEB); // amber-50

  // ── Surfaces ─────────────────────────────────────────────────────────────
  // Clean neutral surfaces — no blue tinting
  static const Color background     = Color(0xFFF5F7FA); // neutral-100
  static const Color surface        = Color(0xFFFFFFFF); // pure white cards
  static const Color surfaceVariant = Color(0xFFF3F4F6); // gray-100 inputs
  static const Color border         = Color(0xFFE5E7EB); // gray-200

  // ── Navigation ───────────────────────────────────────────────────────────
  static const Color navBackground = Color(0xFF1E3A5F);
  static const Color navSurface    = Color(0xFF1E3A5F);

  // ── Text ─────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFF111827); // gray-900
  static const Color textSecondary = Color(0xFF6B7280); // gray-500
  static const Color textHint      = Color(0xFF9CA3AF); // gray-400
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnNav     = Color(0xFFE5E7EB);

  // ── Badges / Tags ─────────────────────────────────────────────────────────
  static const Color adminTag      = Color(0xFF2563EB);
  static const Color adminTagLight = Color(0xFFEFF6FF);

  // ── Stat card accents ─────────────────────────────────────────────────────
  static const Color statGreen      = Color(0xFF10B981);
  static const Color statGreenLight = Color(0xFFECFDF5);
  static const Color statPurple     = Color(0xFF8B5CF6);
  static const Color statPurpleLight= Color(0xFFF5F3FF);

  // ── Gradients ─────────────────────────────────────────────────────────────
  /// Deep navy → brand blue — AppBar / hero cards
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// AppBar nav gradient
  static const LinearGradient navGradient = LinearGradient(
    colors: [Color(0xFF1E3A5F), Color(0xFF2563EB)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  /// Hero sky gradient
  static const LinearGradient skyGradient = LinearGradient(
    colors: [Color(0xFF1E3A5F), Color(0xFF2563EB), Color(0xFF38BDF8)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Teal-blue card gradient (for highlighted cards)
  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF1E40AF), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF38BDF8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient greenGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

// ─── Theme Data ───────────────────────────────────────────────────────────────
class AppTheme {
  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.light,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        scaffoldBackgroundColor: AppColors.background,
        fontFamily: 'Poppins',

        // ── AppBar ────────────────────────────────────────────────────────────
        appBarTheme: const AppBarTheme(
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.textOnPrimary,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: AppColors.textOnPrimary,
            fontFamily: 'Poppins',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          ),
          iconTheme: IconThemeData(color: AppColors.textOnPrimary),
        ),

        // ── Elevated Button ───────────────────────────────────────────────────
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 0,
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.textOnPrimary,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ),

        // ── Outlined Button ───────────────────────────────────────────────────
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary, width: 1.5),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 18),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),

        // ── Text Button ───────────────────────────────────────────────────────
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── Input Decoration ──────────────────────────────────────────────────
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surfaceVariant,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
          labelStyle:
              const TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),

        // ── Card ──────────────────────────────────────────────────────────────
        cardTheme: CardThemeData(
          elevation: 0,
          color: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.symmetric(vertical: 6),
          shadowColor: Colors.black12,
        ),

        // ── Chip ──────────────────────────────────────────────────────────────
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.surfaceVariant,
          selectedColor: AppColors.primaryLight,
          labelStyle: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: AppColors.border),
          ),
          side: const BorderSide(color: AppColors.border),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        ),

        // ── Divider ───────────────────────────────────────────────────────────
        dividerTheme: const DividerThemeData(
          color: AppColors.border,
          thickness: 1,
        ),

        // ── SnackBar ──────────────────────────────────────────────────────────
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.textPrimary,
          contentTextStyle: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),

        // ── Dialog ────────────────────────────────────────────────────────────
        dialogTheme: DialogThemeData(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 4,
          titleTextStyle: const TextStyle(
            color: AppColors.textPrimary,
            fontFamily: 'Poppins',
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
          contentTextStyle: const TextStyle(
            color: AppColors.textSecondary,
            fontFamily: 'Poppins',
            fontSize: 14,
          ),
        ),

        // ── FAB ───────────────────────────────────────────────────────────────
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          elevation: 3,
        ),

        // ── Bottom Navigation Bar ─────────────────────────────────────────────
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: AppColors.surface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textHint,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w400,
          ),
        ),

        // ── List Tile ─────────────────────────────────────────────────────────
        listTileTheme: const ListTileThemeData(
          tileColor: AppColors.surface,
          iconColor: AppColors.primary,
          textColor: AppColors.textPrimary,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
        ),

        // ── Text Theme ────────────────────────────────────────────────────────
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 32,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
          displayMedium: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 26,
            fontWeight: FontWeight.w700,
          ),
          titleLarge: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          titleMedium: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          titleSmall: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          bodyLarge: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w400,
          ),
          bodyMedium: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
          bodySmall: TextStyle(
            color: AppColors.textHint,
            fontSize: 12,
            fontWeight: FontWeight.w400,
          ),
          labelLarge: TextStyle(
            color: AppColors.primary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.4,
          ),
        ),
      );
}

// ─── Custom Page Routes ────────────────────────────────────────────────────────
class FadePageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;
  FadePageRoute({required this.page})
      : super(
          pageBuilder: (_, __, ___) => page,
          transitionDuration: const Duration(milliseconds: 300),
          transitionsBuilder: (_, animation, __, child) {
            return FadeTransition(
              opacity:
                  CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child: child,
            );
          },
        );
}

class SlideUpPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;
  SlideUpPageRoute({required this.page})
      : super(
          pageBuilder: (_, __, ___) => page,
          transitionDuration: const Duration(milliseconds: 350),
          transitionsBuilder: (_, animation, __, child) {
            final tween = Tween(
              begin: const Offset(0, 0.1),
              end: Offset.zero,
            ).chain(CurveTween(curve: Curves.easeOutCubic));
            return FadeTransition(
              opacity:
                  CurvedAnimation(parent: animation, curve: Curves.easeOut),
              child:
                  SlideTransition(position: animation.drive(tween), child: child),
            );
          },
        );
}

// ─── Reusable Animation Widgets ───────────────────────────────────────────────

/// Fade + slide-up entrance animation
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double slideOffset;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 500),
    this.slideOffset = 24,
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slide = Tween<Offset>(
      begin: Offset(0, widget.slideOffset / 100),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// Animated scale on tap (press effect)
class TapScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  const TapScale({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 0.97,
  });

  @override
  State<TapScale> createState() => _TapScaleState();
}

class _TapScaleState extends State<TapScale>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 150),
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: widget.scale)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(scale: _scaleAnim, child: widget.child),
    );
  }
}

/// Staggered list entrance — wrap a list and each child comes in delayed
class StaggeredList extends StatefulWidget {
  final List<Widget> children;
  final Duration itemDelay;

  const StaggeredList({
    super.key,
    required this.children,
    this.itemDelay = const Duration(milliseconds: 80),
  });

  @override
  State<StaggeredList> createState() => _StaggeredListState();
}

class _StaggeredListState extends State<StaggeredList> {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(widget.children.length, (i) {
        return FadeSlideIn(
          delay: widget.itemDelay * i,
          child: widget.children[i],
        );
      }),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
class AppShadows {
  /// Very subtle surface lift
  static List<BoxShadow> get soft => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 12,
          offset: const Offset(0, 2),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];

  /// Standard card shadow
  static List<BoxShadow> get medium => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.07),
          blurRadius: 20,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 6,
          offset: const Offset(0, 1),
        ),
      ];

  /// Brand accent shadow for primary buttons / FAB
  static List<BoxShadow> get colored => [
        BoxShadow(
          color: AppColors.primary.withValues(alpha: 0.22),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  /// Clean border-replacement shadow for white cards on gray background
  static List<BoxShadow> get card => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          blurRadius: 16,
          offset: const Offset(0, 3),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];
}