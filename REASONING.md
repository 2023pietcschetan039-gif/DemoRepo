# Reasoning Behind the Solution

## 1. Understanding the Problem

The application is designed to manage contributions for a shared group expense.

Different members may contribute different amounts, so the application needs to calculate the fair share of each member and determine who owes money and who should receive money.

The solution was designed to work for any contribution pool instead of being hardcoded for one specific farewell gift example.

## 2. Core Approach

The application follows a simple flow:

```text
Create Pool
    ↓
Add Members
    ↓
Track Contributions
    ↓
Calculate Fair Share
    ↓
Calculate Balances
    ↓
Generate Settlements

3. Fair Share Calculation

The fair share is calculated equally among all members.

Fair Share = Total Budget / Number of Members

For each member:

Balance = Amount Paid - Fair Share

A positive balance means the member has contributed more than their fair share.

A negative balance means the member has contributed less than their fair share.

A zero balance means the member has reached their fair share.

4. Settlement Approach

The settlement logic separates members into two groups:

Members who owe money
Members who should receive money

The algorithm matches these groups using the smaller amount between the amount owed and the amount to be received.

For example:

Rahul owes ₹500
Amit should receive ₹500

Settlement:
Rahul pays Amit ₹500

This produces simple and easy-to-understand settlement suggestions.

5. Handling Messy Imported Data

The new requirement introduces historical contribution data that may not be clean.

The import process therefore separates data processing into multiple steps.

5.1 Name Normalization

Names are cleaned by:

Removing leading and trailing spaces
Normalizing repeated spaces
Comparing names without considering capitalization

For example:

Chetan
chetan
CHETAN
 Chetan

are treated as name variants of the same person.

The implementation avoids aggressively merging unrelated names.

5.2 Amount Normalization

Amounts can appear in different common formats.

Examples:

1000
1000.00
₹1000
₹ 1,000
1,000
Rs. 1000

The importer converts these values into a consistent numeric representation before calculations.

5.3 Validation

Every imported row is validated.

Rows can be rejected when:

The name is missing
The amount is missing
The amount cannot be parsed
The amount is negative
The row structure is invalid

Rejected rows are reported with a reason instead of being silently ignored.

6. Duplicate Handling

Duplicate handling is separated from name normalization.

The same person can make multiple legitimate contributions, so every repeated name is not considered a duplicate.

For example:

Chetan ₹1000
Chetan ₹500

can represent two legitimate contributions.

The application therefore uses normalized contribution information when identifying exact duplicate records.

Duplicate records are reported separately so that they do not get counted twice.

7. Import Review

Imported data is not immediately applied to the pool.

The application first shows an import review containing:

Total rows
Imported rows
Duplicates
Merged names
Rejected rows
Details about each processed record

This gives the user an opportunity to review the cleaned data before applying it.

8. Unknown Members

An imported name may not already exist in the current pool.

Instead of silently discarding the contribution, the application provides an option to map the imported name to an existing member or add it as a new member.

This prevents contribution data from being lost.

9. Integration With Existing Logic

The messy import feature was added as an extension to the existing application.

The existing functionality was preserved, including:

Pool creation
Member management
Manual contribution entry
Total collection
Remaining amount
Fair share
Balance calculation
Settlement suggestions
localStorage

After a confirmed import, the cleaned contribution data is applied to the existing pool and the existing calculation logic is reused.

This avoids maintaining two separate balance or settlement systems.

10. Frontend-Only Design

The application uses a frontend-only architecture with React, Vite, JavaScript, CSS, and localStorage.

A backend or external database was not added because the current problem can be solved locally and the focus is on contribution processing, validation, reporting, and settlement.

Keeping the application frontend-only also reduces unnecessary infrastructure and keeps the solution simple to run and test.

11. Design Decisions

The implementation prioritizes:

Correct calculations
Clear validation
Transparent import results
Simple user interaction
Reusable existing logic
Minimal changes to the working application
Responsive design

The import feature was implemented as a minimal extension rather than rewriting the existing application.

12. Testing Strategy

The application was tested using:

Normal contribution data
Different name capitalization and spacing
Different currency formats
Duplicate records
Multiple legitimate payments from the same person
Missing names
Missing amounts
Invalid amounts
Negative amounts
Unknown members
Balance recalculation
Settlement recalculation

The project was also checked using:

npm run lint
npm run build

Both checks completed successfully after implementing the import feature.

13. Summary

The final solution combines a contribution tracker with a small data-cleaning and reconciliation workflow.

The main design principle is:

Messy Data
    ↓
Clean & Normalize
    ↓
Validate
    ↓
Identify Duplicates / Name Variants
    ↓
Show Transparent Report
    ↓
User Confirmation
    ↓
Apply Clean Data
    ↓
Calculate Correct Balances
    ↓
Generate Simple Settlements

This approach keeps the application simple while addressing the additional messy-data requirement.
