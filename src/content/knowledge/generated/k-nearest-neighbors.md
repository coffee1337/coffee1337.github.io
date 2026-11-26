<!-- lang: en -->
# K-Nearest Neighbors from Scratch — README

Source: https://github.com/coffee1337/k-nearest-neighbors

🧠 K-Nearest Neighbors from Scratch

### C++17 implementation of the k-NN classification algorithm with a WinAPI desktop interface

> **Interactive case study →**

📖 About

Desktop application implementing the **k-Nearest Neighbors (k-NN)** classification algorithm from scratch in C++.

The project was created to explore how k-NN works internally without relying on machine-learning libraries.

The application provides a graphical interface for loading CSV datasets, configuring classification parameters and analysing prediction results.

✨ Features

- k-NN classification implemented from scratch
- CSV dataset loading
- configurable number of neighbors (`k`)
- multiple distance metrics
- simple and weighted voting
- feature normalization
- feature selection
- test sample generation
- graphical Windows interface
- classification result export

📐 Distance Metrics

The classifier supports several distance functions.

### Euclidean distance

### Manhattan distance

### Cosine distance

This makes it possible to compare how different metrics affect classification results.

🗳 Voting Strategies

Two prediction strategies are supported.

### Simple voting

Every nearest neighbor contributes one vote to its class.

### Weighted voting

Closer neighbors have a stronger influence on the final prediction.

This allows the classifier to account for both class frequency and neighbor distance.

🛠 Tech Stack

- **C++17**
- **STL**
- **WinAPI**
- **CMake**
- **CSV data processing**

No external machine-learning framework is used for the k-NN algorithm itself.

🏗 Project Structure

The core classifier, data processing and UI logic are separated into independent components.

🚀 Building

### Requirements

- Windows
- C++17-compatible compiler
- CMake
- Visual Studio / MSVC or compatible Windows C++ toolchain

Clone the repository:

Create a build directory:

Build the application:

The resulting executable will be located inside the CMake build output directory.

🖥 Usage

Launch the application and load a CSV dataset.

Then:

1. Select the features used for classification.
2. Choose the target variable.
3. Set the number of neighbors (`k`).
4. Select a distance metric.
5. Choose simple or weighted voting.
6. Enable normalization if required.
7. Enter or generate a test sample.
8. Run classification.

The application displays the predicted class, confidence information and nearest neighbors.

🧪 Example

Example configuration using the Iris dataset:

Example test sample:

Example output:

📊 What This Project Demonstrates

The project focuses on implementing the algorithm rather than calling an existing ML library.

It demonstrates:

- understanding of the k-NN algorithm;
- distance calculations;
- data normalization;
- CSV parsing and data processing;
- C++ application architecture;
- desktop UI development with WinAPI;
- build configuration with CMake.

📄 Documentation

Additional project results and analysis are available in:

🔮 Possible Improvements

- train/test split evaluation
- confusion matrix
- accuracy metrics
- automatic `k` selection
- benchmark mode
- additional datasets
- unit tests for classifier and distance metrics
- GUI modernization

👨‍💻 Author

**Egor Trefilov / Coffee1337**

GitHub:
https://github.com/Coffee1337

Portfolio:
https://coffee1337.github.io
