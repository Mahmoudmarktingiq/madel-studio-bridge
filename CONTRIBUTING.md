# Contributing to MADEL Studio Bridge

Thank you for your interest in contributing to **MADEL Studio Bridge**!

## Development Guidelines

1. **Local-First & Safety First**: Never compromise local sandboxing, never introduce automatic administrator elevation, and ensure all networking stays bound to local loopback by default.
2. **Adapter Isolation**: Each application adapter must reside in its own folder under `adapters/` and implement the standard lifecycle methods (`detect`, `connect`, `disconnect`, `listCapabilities`, `execute`).
3. **No Closed-Source Redistribution**: Do not bundle proprietary Adobe binaries, closed-source dependencies, or copyrighted media files in commits.
4. **Attribution & Licenses**: Maintain all Apache-2.0 notices, third-party notices, and legal disclaimers.

## Pull Request Process

1. Fork the repository and create a feature branch (`feature/your-adapter-name`).
2. Implement your changes with accompanying tests in `tests/`.
3. Ensure all tests pass and `npm audit` reports zero vulnerabilities.
4. Submit your pull request with a detailed description of the changes.
