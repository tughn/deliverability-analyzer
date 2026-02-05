# Email Deliverability Analyzer

## Project Status: Deprecated

This project has been deprecated and is no longer actively maintained.

### Reason for Deprecation

The architecture relied on Cloudflare Email Routing, which enforces SPF validation at the MX level before emails reach the worker. This means emails that fail SPF authentication are rejected before they can be analyzed, which defeats the purpose of a deliverability testing tool.

A deliverability analyzer should be able to receive and analyze ALL emails, including those with authentication failures, to provide useful feedback to users about their configuration issues.

### Alternative Solutions

For email deliverability testing, consider these established tools:

- [Mail-Tester](https://www.mail-tester.com/) - Comprehensive email testing
- [MXToolbox](https://mxtoolbox.com/) - DNS and email diagnostics
- [Sendmarc DMARC Analyzer](https://sendmarc.com/dmarc/dmarc-analyzer/) - DMARC analysis and monitoring

### Technical Summary

The project consisted of:

- **Frontend**: Next.js application hosted on Vercel
- **Backend**: Cloudflare Worker for email processing
- **Storage**: Cloudflare KV for result storage
- **Email Routing**: Cloudflare Email Routing (catch-all to worker)

The core limitation was that Cloudflare Email Routing validates incoming emails against the sender's SPF record and rejects emails that fail with a hardfail (-all) policy. This behavior cannot be disabled.

### License

This project remains available under the MIT License for reference purposes.

---

*This repository is archived and read-only.*
