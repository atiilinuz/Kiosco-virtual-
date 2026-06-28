# Security Specification for Kiosco Digital

## 1. Data Invariants
- **Products**: Any product in the store must have a valid `id`, a non-empty `name`, a non-negative `price`, a non-negative `stock`, and valid `category`.
- **Users**: Users must have a unique `username`, a hashed `password` of safe length, and role strictly either 'admin' or 'user'.
- **Logs**: Every `LoginLog` entry is immutable once created. It must specify a valid `userId`.
- **Sales**: Sales must specify the user who made them (`userId` and `username`), contain a valid list of purchased items, and have non-negative `total`. Immutable after creation.
- **Suppliers**: Suppliers must have valid contact details.

## 2. The "Dirty Dozen" Payloads (Exploit Scenarios)
1. **Unauthenticated Write to Products**: An anonymous user attempts to update a product price to $0.
2. **Privilege Escalation on User Profile**: A standard `user` attempts to update their own role field to `admin`.
3. **Invalid Stock Update**: Attempting to set product stock to a negative number (`-50`).
4. **Altering Sale Invoices**: Attempting to update a historic `Sale` document to change the total amount or items purchased.
5. **Falsified Owner Creation**: Attempting to set `userId` of a log or sale to another user's UID.
6. **Spoofing Login log**: Attempting to write a login log without being logged in.
7. **Junk ID Poisoning**: Trying to create a product with an ID that has invalid characters or exceeds size limits.
8. **Malicious Empty Fields**: Trying to create a product with empty/missing required name field.
9. **No Price/String Price**: Trying to insert a product where the price is a string instead of a number.
10. **Tampering with logs**: Standard user attempting to delete a system login log to cover their tracks.
11. **Altering supplier details**: Standard user attempting to create or delete a supplier.
12. **Modifying created date**: Attempting to modify `createdAt` or `timestamp` field after document creation.

## 3. Test Runner Concept (firestore.rules.test.ts)
```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification of permission denials and rules.
// Test cases verify that the "Dirty Dozen" payloads return PERMISSION_DENIED.
```
