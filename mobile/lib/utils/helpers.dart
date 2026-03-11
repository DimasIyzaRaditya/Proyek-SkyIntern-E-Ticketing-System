import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class LocalStorage {
  static const String userKey = 'skyintern_user';
  static const String tokenKey = 'skyintern_token';

  static Future<void> saveUser(UserSession user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(userKey, json.encode(user.toJson()));
    await prefs.setString(tokenKey, token);
  }

  static Future<UserSession?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(userKey);
    if (userJson == null) return null;
    try {
      return UserSession.fromJson(json.decode(userJson) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(userKey);
    await prefs.remove(tokenKey);
  }
}

void showSnackBar(BuildContext context, String message, {bool isError = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: isError ? Colors.red : Colors.green,
      duration: Duration(seconds: 3),
    ),
  );
}

Future<void> showErrorDialog(BuildContext context, String title, String message) {
  return showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('OK'),
        ),
      ],
    ),
  );
}

class TimeHelper {
  static String getHolidayName(String dateStr) {
    const holidays = {
      '2026-01-01': 'Tahun Baru',
      '2026-02-17': 'Isra Miraj',
      '2026-03-19': 'Nyepi',
      '2026-03-20': 'Idul Fitri',
      '2026-03-21': 'Idul Fitri',
      '2026-04-03': 'Wafat Isa Almasih',
      '2026-05-01': 'Hari Buruh',
      '2026-05-14': 'Kenaikan Isa Almasih',
      '2026-05-28': 'Waisak',
      '2026-06-01': 'Hari Lahir Pancasila',
      '2026-07-17': 'Tahun Baru Islam',
      '2026-08-17': 'Kemerdekaan RI',
      '2026-09-24': 'Maulid Nabi',
      '2026-12-25': 'Natal',
    };
    return holidays[dateStr] ?? '';
  }
}
