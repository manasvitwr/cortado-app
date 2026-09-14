---
name: Published data compatibility
description: Compatibility rule for deployed databases and older user records.
---

Published databases can contain records created before current input rules or schema expectations. A response serializer must be able to read those records so existing users can sign in and load their library.

**Why:** A strict response validator turned a legacy username into a 500 from the profile endpoint, which the client displayed as an indefinite redirect during signup.

**How to apply:** Keep validation strict for new writes and profile edits, but make read/response schemas compatible with legacy stored values. Treat deployment schema updates as part of publishing, not as a reason to silently rewrite user data.