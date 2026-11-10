# Security Policy — MADEL Studio Bridge

## Supported Versions

| Version | Supported |
| :--- | :---: |
| 1.0.x | Yes |
| < 1.0 | No |

## Reporting Security Vulnerabilities

We take security and least-privilege containment very seriously. If you discover a vulnerability or potential attack vector:

1. **Do not create a public issue.**
2. Send a confidential report to the project maintainer: Mahmoud Adel.
3. Include detailed steps to reproduce, affected versions, and potential impact.

## Security Architecture Principles

- **No Raw Script Execution**: Arbitrary script injection is disabled by default (`BRAINFERNO_MCP_ALLOW_RAW_SCRIPTS=0`).
- **Loopback Isolation**: WebSocket servers are bound strictly to `127.0.0.1` / `localhost` with origin and host validation.
- **Token Authentication**: Handshake files are protected by local operating system user permissions (0600 equivalent).
- **No Windows Administrator Elevation**: The bridge runs strictly within user-space permissions.
