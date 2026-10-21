# Google Play — Data safety answers

These answers match the current LogistiTrack Android shell and web app.

## Does the app collect or share user data?
- **Collects:** yes
- **Shares:** no (service providers only process data on our behalf)
- **Encrypted in transit:** yes
- **Users can request deletion:** yes
- **Deletion URL:** https://logistic-management-ui.pages.dev/delete-account

## Data types

| Data type | Collected | Optional | Purpose |
| --- | --- | --- | --- |
| Name | Yes | No | Account, transport assignment, delivery |
| Email address | Yes | No | Sign-in, invitations, password links |
| Phone number | Yes | Yes | Dispatch and delivery contact |
| User IDs | Yes | No | Authentication and company isolation |
| Address (company / route places) | Yes | No | Transport routing, pickup and delivery |
| Other in-app messages | Yes | Yes | Dispatch ↔ driver conversations, support |
| Other user-generated content | Yes | Yes | Cargo descriptions, notes, incident reports, POD/CMR |
| App activity / other actions | Yes | No | Transport status, loading/unloading timestamps |

## Not collected
- Precise or approximate device location (the app does not request location permission)
- Financial info or payment info
- Health or fitness data
- Contacts, calendar, photos, files, SMS, call logs
- Advertising ID
- Browsing history

## Security
- HTTPS only. The Android app has cleartext traffic disabled.
- Passwords are stored as BCrypt hashes on the server.
- Company-level access control and role-based authorization.
- JWT signing key is generated per installation and stored in the database.

## Data handling
- Data is processed to provide transport operations, authentication, email
  invitations, route distance calculation and support.
- Data is not sold and is not used for advertising.
- Processors: Microsoft SQL Server hosting, Cloudflare Pages (web delivery),
  Google Gmail SMTP (transactional email), OpenStreetMap/OSRM (route distance).
- Retention: while the company account is active, then deleted on request,
  subject to legal retention duties.

## Account deletion
- Managers can remove drivers in-app.
- Account/company deletion requests are handled through the public deletion page
  within 30 days after verification.
