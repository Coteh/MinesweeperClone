# Cypress Tests for Theme Management

This directory contains Cypress end-to-end tests for the theme management feature.

## Setup

First, install Cypress (note: Cypress binary download requires internet access):

```bash
npm install --save-dev cypress
```

## Running Tests

### Interactive Mode (Cypress Test Runner)

```bash
npm run cypress:open
```

This will open the Cypress Test Runner UI where you can select and run tests interactively.

### Headless Mode (CI/CD)

```bash
npm run cypress:run
```

This will run all tests in headless mode, suitable for continuous integration.

## Test Files

- **theme.cy.ts**: Tests for theme color meta tag management
  - Verifies meta tag existence
  - Tests dimmed and normal theme color application
  - Tests color blending algorithm
  - Tests theme switching scenarios
  - Tests hex to RGB conversion

## Prerequisites

Before running tests, ensure the development server is running:

```bash
npm run dev
```

The tests expect the application to be available at `http://localhost:5173`.
