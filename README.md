# Contribution Pool & Settlement Tracker

A simple web application for managing group contributions, calculating fair shares, tracking balances, and generating simple settlement suggestions.

The application can also import messy past contribution data, clean it, identify duplicates and name variations, reject invalid rows, and show an import summary before applying the cleaned contributions.

## Project Overview

This project solves a common group-payment problem.

For example, a group may have a fixed budget for a farewell gift. Different members may contribute different amounts. The application calculates each member's fair share and shows who owes money and who should receive money.

The application is designed to work with any contribution pool rather than one fixed example.

## Features

### Pool Management

- Create a contribution pool
- Set pool/event name
- Set total budget
- Set organizer
- Add members
- Remove members

### Contribution Tracking

- Enter each member's contribution
- View total collected
- View remaining amount
- Calculate equal/fair share
- View individual balances
- Identify members who owe money
- Identify members who have paid extra

### Settlement

The application generates simple settlement suggestions between members.

For example:

> Rahul pays Amit ₹500

The settlement logic matches members who owe money with members who have paid extra.

### Messy Contribution Import

The application supports importing past contributions through:

- CSV upload
- Pasted contribution text

Imported data can contain:

- Duplicate entries
- Different capitalization or spacing in names
- Different amount formats
- Invalid rows

The import process cleans and validates the data before applying it to the pool.

### Name Normalization

Names are normalized by:

- Removing leading/trailing spaces
- Normalizing repeated spaces
- Comparing names case-insensitively

For example:

```text
Chetan
chetan
CHETAN
 Chetan