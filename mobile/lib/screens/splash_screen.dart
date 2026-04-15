import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../utils/app_theme.dart';

class SkyInternSplashScreen extends StatefulWidget {
  final String? role;
  final bool isAppReady;

  const SkyInternSplashScreen({
    super.key,
    required this.role,
    required this.isAppReady,
  });

  @override
  State<SkyInternSplashScreen> createState() => _SkyInternSplashScreenState();
}

class _SkyInternSplashScreenState extends State<SkyInternSplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<Offset> _titleSlide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat();

    _logoScale = Tween<double>(begin: 0.78, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOutBack),
      ),
    );
    _logoFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.24, curve: Curves.easeOut),
    );
    _titleSlide = Tween<Offset>(
      begin: const Offset(0, 0.32),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.08, 0.4, curve: Curves.easeOutCubic),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final pulse = 0.92 + (math.sin(_controller.value * math.pi * 2) * 0.06);
          final planeX = (_controller.value * 2.2) - 1.1;
          final cloudShift = math.sin(_controller.value * math.pi * 2) * 14;
          final orbitAngle = _controller.value * math.pi * 2;

          final roleText = widget.role?.toLowerCase().trim() ?? '';
          final tagline = !widget.isAppReady
              ? 'Menyiapkan perjalanan Anda...'
              : roleText == 'admin'
              ? 'Admin Command Center'
              : 'Your Journey Starts Here';

          final backgroundGradient = LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primaryDark,
              const Color(0xFF203F67),
              AppColors.primary,
            ],
          );

          return Container(
            decoration: BoxDecoration(
              gradient: backgroundGradient,
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Positioned(
                  left: -100,
                  top: -60,
                  child: Transform.scale(
                    scale: pulse,
                    child: _buildGlow(const Color(0x553B82F6), 240),
                  ),
                ),
                Positioned(
                  right: -70,
                  bottom: 80,
                  child: Transform.scale(
                    scale: 1.15 - (pulse - 0.92),
                    child: _buildGlow(const Color(0x3348CAE4), 190),
                  ),
                ),
                Positioned(
                  left: -80 + cloudShift,
                  bottom: 120,
                  child: _buildCloud(170, 54, Colors.white.withValues(alpha: 0.10)),
                ),
                Positioned(
                  right: -48 - (cloudShift * 0.8),
                  top: 140,
                  child: _buildCloud(128, 42, Colors.white.withValues(alpha: 0.08)),
                ),
                Align(
                  alignment: Alignment(planeX, -0.56),
                  child: Transform.rotate(
                    angle: -0.22,
                    child: Icon(
                      Icons.flight_rounded,
                      color: Colors.white.withValues(alpha: 0.28),
                      size: 44,
                    ),
                  ),
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FadeTransition(
                        opacity: _logoFade,
                        child: ScaleTransition(
                          scale: _logoScale,
                          child: Container(
                            width: 108,
                            height: 108,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.16),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.42),
                                width: 2,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x5512253F),
                                  blurRadius: 26,
                                  offset: Offset(0, 14),
                                ),
                              ],
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Transform.translate(
                                  offset: Offset(
                                    math.cos(orbitAngle) * 6,
                                    math.sin(orbitAngle) * 6,
                                  ),
                                  child: Container(
                                    width: 94,
                                    height: 94,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Colors.white.withValues(alpha: 0.22),
                                        width: 1.3,
                                      ),
                                    ),
                                  ),
                                ),
                                ClipOval(
                                  child: Image.asset(
                                    'assets/images/skyintern_logo.png',
                                    width: 76,
                                    height: 76,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, _, __) => const Icon(
                                      Icons.flight_takeoff_rounded,
                                      color: Colors.white,
                                      size: 54,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      FadeTransition(
                        opacity: _logoFade,
                        child: SlideTransition(
                          position: _titleSlide,
                          child: const Text(
                            'SkyIntern',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      FadeTransition(
                        opacity: _logoFade,
                        child: Text(
                          'E-Ticketing System',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.84),
                            fontSize: 13,
                            letterSpacing: 2.2,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(height: 34),
                      SizedBox(
                        width: 150,
                        child: LinearProgressIndicator(
                          minHeight: 5,
                          backgroundColor: Colors.white.withValues(alpha: 0.16),
                          valueColor:
                              const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                          value: (_controller.value % 0.94).clamp(0.06, 0.94),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 54,
                  left: 0,
                  right: 0,
                  child: Text(
                    tagline,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildGlow(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }

  Widget _buildCloud(double width, double height, Color color) {
    return SizedBox(
      width: width,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}

class SplashGate extends StatefulWidget {
  final Widget child;
  final String? role;
  final bool isAppReady;
  final bool enableIntroSound;

  const SplashGate({
    super.key,
    required this.child,
    required this.role,
    required this.isAppReady,
    this.enableIntroSound = false,
  });

  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> {
  bool _minDurationPassed = false;

  @override
  void initState() {
    super.initState();

    if (widget.enableIntroSound) {
      SystemSound.play(SystemSoundType.click);
    }

    Future<void>.delayed(const Duration(milliseconds: 2100), () {
      if (!mounted) return;
      setState(() => _minDurationPassed = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 480),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: _minDurationPassed
          ? widget.child
          : SkyInternSplashScreen(
              role: widget.role,
              isAppReady: widget.isAppReady,
            ),
    );
  }
}