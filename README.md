# SENVORA Service Experience Portal

Salesforce Experience Cloud reference implementation demonstrating a maintainable Case management experience built with Lightning Web Components, Apex, Lightning Data Service, and UI API.

This project is a technical reference implementation created by **SENVORA Systems**. It is not presented as a production client implementation.

## Overview

The portal provides a focused Case management workflow:

- Search and filter Cases.
- Browse Case results.
- Select a Case.
- View Case details.
- Create new Cases.
- Refresh the Case workspace automatically after creation.
- Run inside Salesforce Experience Cloud.

The implementation separates server-side querying, client-side state management, record access, and creation responsibilities instead of routing every operation through Apex.

## Architecture

```text
senvoraServicePortal
├── senvoraCaseWorkspace
│   ├── senvoraCaseFilters
│   └── senvoraCaseList
├── senvoraCaseDetail
└── senvoraCaseCreate
```

### Data access strategy

```text
LIST / SEARCH  → Apex
DETAIL         → UI API / Lightning Data Service
CREATE         → Lightning Data Service
REFRESH        → refreshApex
```

Apex is used only where server-side Case filtering provides clear value.

Standard record detail and creation flows use Salesforce platform services directly to avoid unnecessary custom backend logic.

## Components

### `senvoraCaseFilters`

Responsible for user search and filtering controls.

Features:

- Search term input.
- Status filtering.
- Priority filtering.
- Picklist metadata through UI API.
- Debounced text search.
- Custom `filterchange` event.

### `senvoraCaseList`

Presentational Case result list.

Features:

- Receives Cases through `@api`.
- Tracks visual selection through `selectedCaseId`.
- Emits `caseselect`.
- Accessible native button interaction.
- Empty state handling.

### `senvoraCaseWorkspace`

Coordinates filters, querying, result state, and selection.

Responsibilities:

- Reactive Apex Case query.
- Loading, data, empty, and error states.
- Selected Case state.
- Selection reconciliation after result changes.
- Public `refreshCases()` API using `refreshApex()`.

### `senvoraCaseDetail`

Displays the currently selected Case.

Uses:

- `lightning/uiRecordApi`
- `getRecord`
- `getFieldValue`

Fields:

- Case Number
- Subject
- Status
- Priority
- Origin
- Created Date
- Description

The component explicitly prevents stale record data from remaining visible while a new Case is loading.

### `senvoraCaseCreate`

Creates Cases using `lightning-record-edit-form`.

Fields:

- Subject
- Description
- Origin
- Priority

Features:

- Double-submit protection.
- Loading state.
- Safe success and error states.
- Automatic field reset after creation.
- Emits `casecreated { caseId }`.

No Apex is used for record creation.

### `senvoraServicePortal`

Root Experience Cloud component.

Responsibilities:

```text
Workspace
   │
   └── caseselected
          ↓
        Root
          ↓
       Detail

Create
   │
   └── casecreated
          ↓
        Root
          ↓
Workspace.refreshCases()
```

The root intentionally contains minimal logic and does not duplicate Case data, filters, loading state, or server access.

## Apex

`ServicePortalCaseController` provides the read-only server-side Case query used by the workspace.

Key characteristics:

- `with sharing`
- `WITH USER_MODE`
- Static SOQL
- Optional search, Status, and Priority filters
- Input validation
- Literal escaping for `%` and `_` in LIKE searches
- Active picklist value validation
- Maximum search length protection
- Minimal DTO returned to the client
- Maximum of 50 Cases per query
- Safe application-level error messages

The controller does not provide detail or create operations because those responsibilities are delegated to UI API and Lightning Data Service.

## Security

The implementation follows Salesforce platform security rather than recreating it unnecessarily.

### Apex query

Uses:

```apex
public with sharing
```

and:

```sql
WITH USER_MODE
```

to respect record sharing and user-level access.

### Record detail and creation

Use UI API and Lightning Data Service so Salesforce applies supported platform access controls directly.

Technical server errors are not rendered to portal users.

## Experience Cloud

The root component is exposed through:

```xml
<target>lightningCommunity__Page</target>
```

The repository also contains the retrieved Experience Cloud metadata for the reference site.

The implementation was validated end-to-end in a Salesforce development environment using an Experience Cloud site based on the **Build Your Own** template.

## Testing

### Apex

The Case query controller includes Salesforce unit tests covering:

- Filter combinations
- Search behavior
- Validation
- Special LIKE characters
- Empty results
- Invalid inputs
- DTO behavior

Controller validation completed with:

```text
18 Apex tests passed
100% controller coverage
```

### Lightning Web Components

Jest tests cover:

- Filters
- Case list
- Workspace coordination
- Loading and empty states
- Safe error handling
- Case selection
- Selection reconciliation
- `refreshApex`
- UI API detail behavior
- Stale-data prevention
- LDS Case creation
- Double-submit prevention
- Component orchestration

Validation completed with:

```text
6 Jest suites passed
46 Jest tests passed
0 failures
```

Run the LWC tests with:

```bash
npm run test:unit -- -- --runInBand
```

Run ESLint with:

```bash
npm run lint
```

## Project Structure

```text
force-app/main/default/
├── classes/
│   ├── ServicePortalCaseController.cls
│   └── ServicePortalCaseControllerTest.cls
├── experiences/
│   └── SENVORA_Service_Experience_Portal1/
└── lwc/
    ├── senvoraCaseCreate/
    ├── senvoraCaseDetail/
    ├── senvoraCaseFilters/
    ├── senvoraCaseList/
    ├── senvoraCaseWorkspace/
    └── senvoraServicePortal/
```

## Technical Principles

The implementation intentionally favors:

- Clear component ownership.
- Minimal Apex.
- Reactive data flows.
- Salesforce-native security.
- Explicit UI states.
- Maintainable component boundaries.
- Accessible Lightning components.
- Mobile-first Experience Cloud layout.
- Automated testing.
- Source-driven Salesforce development.

It intentionally avoids unnecessary custom frameworks, external APIs, complex state-management libraries, and backend logic where Salesforce platform services already provide the required capability.

## Technology

- Salesforce Platform
- Experience Cloud
- Lightning Web Components
- Apex
- Lightning Data Service
- UI API
- Salesforce DX / CLI
- JavaScript
- Jest
- SLDS
- Git / GitHub

## Status

Reference implementation completed and validated end-to-end in Salesforce Experience Cloud.

## About SENVORA Systems

**SENVORA Systems** is a technology consulting firm focused on:

- Salesforce Consulting
- Enterprise Architecture
- Systems Integration
- Cloud & Infrastructure
- Data & AI Applied

Madrid, Spain.
