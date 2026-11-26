<!-- lang: en -->
# NGIE University App — README

Source: https://github.com/coffee1337/ngieuapp

🎓 NGIE University App

### Cross-platform university companion built with Flutter

**Flutter · Dart · Riverpod · Drift · Kotlin · Swift · WidgetKit**

University application with schedules, notifications, campus information and native Android/iOS widgets.

> **Interactive case study →**

📖 About

NGIE University App is a cross-platform application designed to provide students with quick access to university information and daily academic tools.

The application combines Flutter UI with platform-specific Android and iOS integrations.

Main areas include:

- class schedules;
- academic information;
- university news;
- campus information;
- notifications;
- user settings;
- home-screen and lock-screen widgets.

The project uses a feature-oriented architecture and separates networking, storage, caching and presentation logic.

✨ Features

### 📅 Schedule

The application provides quick access to university schedules.

Schedule functionality is also integrated with:

- local notifications;
- calendar-related features;
- home-screen widgets;
- iOS lock-screen widgets.

Users can see upcoming classes without opening the main application.

🔔 Notifications

The application supports local notifications for schedule-related events.

Notifications can be used to remind students about:

- upcoming classes;
- schedule changes;
- important academic events.

📰 University Content

The application includes dedicated features for:

- university news;
- campus information;
- learning-related content;
- user profile;
- application settings.

📱 Native Widgets

One of the main technical features of the project is native widget integration.

Flutter shares schedule information with platform-specific widget implementations.

### iOS

The project includes a dedicated **WidgetKit extension written in Swift**.

Supported widget types include:

- next lesson;
- wide next-lesson card;
- upcoming lessons;
- today's schedule;
- tomorrow's schedule.

For iOS 16+, lock-screen widgets are also available in:

- inline;
- circular;
- rectangular formats.

The widget extension uses an App Group to exchange data with the Flutter application.

### Android

Android integration provides schedule widgets and lock-screen-oriented functionality through the native Android layer.

The project uses Flutter together with platform-specific Android code where Flutter alone is not sufficient.

🏗 Architecture

The Flutter application follows a feature-oriented structure.

This keeps functionality grouped by domain instead of placing all screens, services and models into global folders.

🧩 Application Layers

A simplified application flow:

Platform-specific functionality is handled separately:

🛠 Tech Stack

### Flutter

- Flutter
- Dart
- Material UI

### State Management

- Riverpod
- Freezed

### Navigation

- GoRouter

### Networking

- Dio
- connectivity_plus

### Local Data

- Drift
- SQLite
- Hive
- flutter_secure_storage

### Notifications

- flutter_local_notifications
- timezone

### Native Integration

- Kotlin
- Swift
- WidgetKit
- home_widget

### Additional

- cached_network_image
- device_calendar
- flutter_inappwebview
- permission_handler
- intl

💾 Offline & Local Data

The application uses multiple storage mechanisms depending on the type of data.

### Drift / SQLite

Used for structured local data that benefits from relational storage and querying.

### Hive

Used for lightweight local application data.

### Secure Storage

Sensitive local values can be stored using platform-provided secure storage.

### Cache

The project contains a dedicated cache layer to reduce unnecessary network requests and improve responsiveness.

🌐 Networking

Network communication is handled through Dio.

The application separates networking concerns from presentation logic through the core network layer.

Connectivity state can also be monitored to handle offline situations more gracefully.

🧭 Navigation

Application routing is implemented with GoRouter.

Navigation is separated from individual feature implementations through:

🎨 UI & Theme

Shared UI components and application styling are separated into:

This helps keep feature code focused on functionality while maintaining consistent application styling.

🧪 Testing

The project contains dedicated tests grouped by application responsibility:

Run tests with:

Run static analysis with:

🔄 CI

GitHub Actions automatically validates the application on pushes and pull requests.

### Android pipeline

The CI pipeline:

### iOS pipeline

The macOS CI runner builds the iOS application and native widget extension for the simulator.

This helps ensure that both Flutter code and iOS-specific integrations remain buildable.

🚀 Getting Started

### Requirements

- Flutter 3.24+
- Dart 3.8+
- Android Studio or compatible Android SDK
- Xcode for iOS development

Clone the repository:

Install dependencies:

Run the application:

🤖 Android Build

Build a release APK:

🍎 iOS Build

Install CocoaPods dependencies:

Then build:

The iOS application and `NgieuWidgets` target must use the same App Group:

This allows the Flutter application to share schedule data with WidgetKit.

🌐 Web

The repository also contains a Flutter Web target.

Run it with:

Build:

Some mobile-specific functionality such as native widgets is naturally available only on the corresponding mobile platform.

📂 Repository Structure

🔮 Possible Improvements

- production backend integration;
- remote push notifications;
- improved offline synchronization;
- additional widget configuration;
- integration and end-to-end tests;
- accessibility improvements;
- performance monitoring;
- release automation.

🎯 What This Project Demonstrates

The project demonstrates experience with:
