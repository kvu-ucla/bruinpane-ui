# TypeScript Style Guide

Concise conventions and best practices for consistent, maintainable TypeScript code.

**Requirements:** TypeScript v5 · typescript-eslint v8 with `strict-type-checked`

---

## TLDR

- Embrace `const` assertions for type safety and immutability.
- Strive for **data immutability** using `Readonly` and `ReadonlyArray`.
- Make the **majority of object properties required** — use optional sparingly.
- **Embrace discriminated unions.**
- **Avoid type assertions** in favor of proper type definitions.
- Strive for functions to be **pure**, **stateless**, and have **single responsibility**.
- Maintain **consistent naming conventions** throughout the codebase.
- Use **named exports**.
- **Organize code by feature** and collocate related code as close as possible.

---

## Types

### Type Inference

Explicitly declare types only when it helps to narrow them.

```ts
// ❌ Avoid
const employees = new Map(); // Inferred as wide type 'Map<any, any>'
employees.set('Lea', 17);
type UserRole = 'admin' | 'guest';
const [userRole, setUserRole] = useState('admin'); // Inferred as 'string', not narrowed literal type

// ✅ Use explicit type declarations to narrow the types.
const employees = new Map<string, number>(); // Narrowed to 'Map<string, number>'
employees.set('Gabriel', 32);
type UserRole = 'admin' | 'guest';
const [userRole, setUserRole] = useState<UserRole>('admin'); // Explicit type 'UserRole'
```

Avoid explicitly declaring types when they can be inferred:

```ts
// ❌ Avoid
const userRole: string = 'admin'; // Inferred as wide type 'string'
const employees = new Map<string, number>([['Gabriel', 32]]); // Redundant type declaration
const [isActive, setIsActive] = useState<boolean>(false); // Redundant, inferred as 'boolean'

// ✅ Use type inference.
const USER_ROLE = 'admin'; // Inferred as narrowed string literal type 'admin'
const employees = new Map([['Gabriel', 32]]); // Inferred as 'Map<string, number>'
const [isActive, setIsActive] = useState(false); // Inferred as 'boolean'
```

### Data Immutability

Wherever possible, data should remain immutable using `Readonly` and `ReadonlyArray`.

```ts
// ❌ Avoid data mutations
const removeFirstUser = (users: Array<User>) => {
  if (users.length === 0) {
    return users;
  }
  return users.splice(1);
};

// ✅ Use readonly type to prevent accidental mutations
const removeFirstUser = (users: ReadonlyArray<User>) => {
  if (users.length === 0) {
    return users;
  }
  return users.slice(1);
  // Using arr.splice(1) errors - Function 'splice' does not exist on 'users'
};
```

### Required & Optional Object Properties

Strive to have the **majority of object properties required** and use optional properties sparingly.

```ts
// ❌ Avoid optional properties when possible
type User = {
  id?: number;
  email?: string;
  dashboardAccess?: boolean;
  adminPermissions?: ReadonlyArray<string>;
  subscriptionPlan?: 'free' | 'pro' | 'premium';
  rewardsPoints?: number;
  temporaryToken?: string;
};

// ✅ Prefer required properties. Use a discriminated union when optionals are unavoidable.
type AdminUser = {
  role: 'admin';
  id: number;
  email: string;
  dashboardAccess: boolean;
  adminPermissions: ReadonlyArray<string>;
};

type RegularUser = {
  role: 'regular';
  id: number;
  email: string;
  subscriptionPlan: 'free' | 'pro' | 'premium';
  rewardsPoints: number;
};

type GuestUser = {
  role: 'guest';
  temporaryToken: string;
};

type User = AdminUser | RegularUser | GuestUser;

const regularUser: User = {
  role: 'regular',
  id: 212,
  email: 'lea@user.com',
  subscriptionPlan: 'pro',
  rewardsPoints: 1500,
  dashboardAccess: false, // Error: 'dashboardAccess' property does not exist
};
```

### Discriminated Union

If there's only one TypeScript feature to embrace, it's discriminated unions.

ESLint rule: `"@typescript-eslint/switch-exhaustiveness-check": "error"`

```ts
type Circle = { kind: 'circle'; radius: number };
type Square = { kind: 'square'; size: number };
type Triangle = { kind: 'triangle'; base: number; height: number };

type Shape = Circle | Square | Triangle;

const calculateArea = (shape: Shape) => {
  // Error - Switch is not exhaustive. Cases not matched: "triangle"
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size * shape.width; // Error - Property 'width' does not exist on type 'square'
  }
};
```

### Type-Safe Constants With Satisfies

Use `as const satisfies` to combine immutability with type validation.

```ts
type UserRole = 'admin' | 'editor' | 'moderator' | 'viewer' | 'guest';

// ❌ Avoid constant of wide type
const DASHBOARD_ACCESS_ROLES: ReadonlyArray<UserRole> = ['admin', 'editor', 'moderator'];

// ❌ Avoid constant with incorrect values
const DASHBOARD_ACCESS_ROLES = ['admin', 'contributor', 'analyst'] as const;

// ✅ Use immutable constant of narrowed type
const DASHBOARD_ACCESS_ROLES = ['admin', 'editor', 'moderator'] as const satisfies ReadonlyArray<UserRole>;
```

```ts
type OrderStatus = {
  pending: 'pending' | 'idle';
  fulfilled: boolean;
  error: string;
};

// ❌ Avoid mutable constant of wide type
const IDLE_ORDER: OrderStatus = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
};

// ❌ Avoid constant with incorrect values
const IDLE_ORDER = {
  pending: 'done',
  fulfilled: 'partially',
  error: 116,
} as const;

// ✅ Use immutable constant of narrowed type
const IDLE_ORDER = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
} as const satisfies OrderStatus;
```

### Template Literal Types

Prefer template literal types over wide `string` for precise, type-safe string constructs.

```ts
// ❌ Avoid
const appVersion = '2.6';
// ✅ Use
type Version = `v${number}.${number}.${number}`;
const appVersion: Version = 'v2.6.1';
```

```ts
// ❌ Avoid
const userEndpoint = '/api/usersss'; // Typo leads to runtime error
// ✅ Use
type ApiRoute = 'users' | 'posts' | 'comments';
type ApiEndpoint = `/api/${ApiRoute}`;
const userEndpoint: ApiEndpoint = '/api/users';
```

```ts
// ❌ Avoid
const homeTitle = 'translation.homesss.title'; // Typo leads to runtime error
// ✅ Use
type LocaleKeyPages = 'home' | 'about' | 'contact';
type TranslationKey = `translation.${LocaleKeyPages}.${string}`;
const homeTitle: TranslationKey = 'translation.home.title';
```

```ts
// ❌ Avoid
const color = 'blue-450'; // Color doesn't exist
// ✅ Use
type BaseColor = 'blue' | 'red' | 'yellow' | 'gray';
type Variant = 50 | 100 | 200 | 300 | 400;
type Color = `${BaseColor}-${Variant}` | `#${string}`;
const iconColor: Color = 'blue-400';
const customColor: Color = '#AD3128';
```

```ts
// ❌ Avoid
const query = 'SELECT name FROM usersss WHERE age > 30'; // Typo, runtime error

// ✅ Use
type Table = 'users' | 'posts' | 'comments';
type Column<TTableName extends Table> =
  TTableName extends 'users' ? 'id' | 'name' | 'age' :
  TTableName extends 'posts' ? 'id' | 'title' | 'content' :
  TTableName extends 'comments' ? 'id' | 'postId' | 'text' :
  never;

type Query<TTableName extends Table> = `SELECT ${Column<TTableName>} FROM ${TTableName} WHERE ${string}`;
const userQuery: Query<'users'> = 'SELECT name FROM users WHERE age > 30'; // Valid
const invalidQuery: Query<'users'> = 'SELECT title FROM users WHERE age > 30'; // Error: 'title' is not a column in 'users'
```

### Type `any` & `unknown`

Never use `any`. Use `unknown` instead and narrow the type before using it.

```ts
// ❌ Avoid any
const foo: any = 'five';
const bar: number = foo; // no type error

// ✅ Use unknown
const foo: unknown = 5;
const bar: number = foo; // type error - Type 'unknown' is not assignable to type 'number'

// Narrow with a type guard
const isNumber = (num: unknown): num is number => {
  return typeof num === 'number';
};
if (!isNumber(foo)) {
  throw Error(`API provided a fault value for field 'foo':${foo}. Should be a number!`);
}
const bar: number = foo;

// Or narrow with a type assertion
const bar: number = foo as number;
```

### Type & Non-Nullability Assertions

Avoid `user as User` and `user!.name` — they silence the compiler and risk runtime crashes. Use only as a last resort with strong rationale.

```ts
type User = { id: string; username: string; avatar: string | null };

// ❌ Avoid type assertions
const user = { name: 'Nika' } as User;

// ❌ Avoid non-nullability assertions
renderUserAvatar(user!.avatar); // Runtime error

const renderUserAvatar = (avatar: string) => { ... }
```

### Type Errors

Use `@ts-expect-error` (never `@ts-ignore`) with a description when suppression is unavoidable.

ESLint rule: `'@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }]`

```ts
// ❌ Avoid @ts-ignore — does nothing if the following line is error-free
// @ts-ignore
const newUser = createUser('Gabriel');

// ✅ Use @ts-expect-error with description
// @ts-expect-error: This library function has incorrect type definitions - createUser accepts string as an argument.
const newUser = createUser('Gabriel');
```

### Type Definition

Use `type` aliases exclusively. Use `interface` only for declaration merging.

ESLint rule: `'@typescript-eslint/consistent-type-definitions': ['error', 'type']`

```ts
// ❌ Avoid interface definitions
interface UserRole = 'admin' | 'guest'; // Invalid - interfaces can't define type unions

interface UserInfo {
  name: string;
  role: 'admin' | 'guest';
}

// ✅ Use type definition
type UserRole = 'admin' | 'guest';

type UserInfo = {
  name: string;
  role: UserRole;
};
```

For declaration merging (e.g., extending third-party types), use `interface` and disable the rule:

```ts
// types.ts
declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    CUSTOM_ENV_VAR: string;
  }
}

// server.ts
app.listen(process.env.PORT, () => { ... })
```

### Array Types

Use generic syntax.

ESLint rule: `'@typescript-eslint/array-type': ['error', { default: 'generic' }]`

```ts
// ❌ Avoid
const x: string[] = ['foo', 'bar'];
const y: readonly string[] = ['foo', 'bar'];

// ✅ Use
const x: Array<string> = ['foo', 'bar'];
const y: ReadonlyArray<string> = ['foo', 'bar'];
```

### Type Imports and Exports

Always separate type imports using `import type`.

ESLint rule: `'@typescript-eslint/consistent-type-imports': 'error'`

```ts
// ❌ Avoid — entire module may be included in the bundle unnecessarily
import { MyClass } from 'some-library';

// ✅ Use — ensures only the type is imported, no runtime code
import type { MyClass } from 'some-library';
```

### Generated Types for Services

Generate types from API contracts (Swagger, GraphQL schemas, etc.) using tools like `openapi-ts` or `graphql-config`. Never manually maintain types that can go out of sync with external services.

---

## Functions

- **Single responsibility.**
- **Stateless** — same inputs always return the same output.
- **Pure** — no side effects, no reading/writing outside local scope.
- Accept at least one argument and return data.

### Single Object Arg

Use an options object instead of multiple positional args (except for single-primitive functions).

```ts
// ❌ Avoid multiple arguments
transformUserInput('client', false, 60, 120, null, true, 2000);

// ✅ Use options object as argument
transformUserInput({
  method: 'client',
  isValidated: false,
  minLines: 60,
  maxLines: 120,
  defaultInput: null,
  shouldLog: true,
  timeout: 2000,
});
```

### Required & Optional Args

Majority of args should be required. If a function becomes too complex, break it into smaller pieces. Ten functions with 5 required args each is better than one function that accepts 50 optional args.

### Args as Discriminated Type

Use discriminated unions to eliminate optional args.

```ts
// ❌ Avoid optional properties in function args
type StatusParams = {
  data?: Products;
  title?: string;
  time?: number;
  error?: string;
};

// ✅ Use discriminated union with required properties
type StatusSuccessParams = {
  status: 'success';
  data: Products;
  title: string;
};

type StatusLoadingParams = {
  status: 'loading';
  time: number;
};

type StatusErrorParams = {
  status: 'error';
  error: string;
};

type StatusParams = StatusSuccessParams | StatusLoadingParams | StatusErrorParams;

export const parseStatus = (params: StatusParams) => { ... }
```

### Return Types

Explicit return types are encouraged. Rule of thumb: **explicit on the outside** (APIs, libraries), **implicit on the inside** (internal logic).

ESLint rule: `"@typescript-eslint/explicit-function-return-type": "error"`

---

## Variables

### Const Assertion

Declare constants with `as const` for literal types and immutability.

```ts
// ❌ Avoid
const FOO_LOCATION = { x: 50, y: 130 }; // Type { x: number; y: number; }
FOO_LOCATION.x = 10;

// ✅ Use
const FOO_LOCATION = { x: 50, y: 130 } as const; // Type '{ readonly x: 50; readonly y: 130; }'
FOO_LOCATION.x = 10; // Error
```

```ts
// ❌ Avoid
const BAR_LOCATION = [50, 130]; // Type number[]
BAR_LOCATION.push(10);

// ✅ Use
const BAR_LOCATION = [50, 130] as const; // Type 'readonly [50, 130]'
BAR_LOCATION.push(10); // Error
```

```ts
// ❌ Avoid
const RATE_LIMIT = 25;
const RATE_LIMIT_MESSAGE = `Max number of requests/min is ${RATE_LIMIT}.`; // Type string

// ✅ Use
const RATE_LIMIT = 25;
const RATE_LIMIT_MESSAGE = `Max number of requests/min is ${RATE_LIMIT}.` as const; // Narrowed literal type
```

### Enums & Const Assertion

**Enums are discouraged** due to runtime cost and pitfalls. Prefer literal types, const assertion arrays, or const assertion objects.

ESLint rule: ban `TSEnumDeclaration` via `no-restricted-syntax`.

```ts
// ❌ Avoid enums — they increase bundle size
enum UserRole {
  GUEST = 'guest',
  MODERATOR = 'moderator',
  ADMINISTRATOR = 'administrator',
}

// Transpiles to runtime JavaScript:
var UserRole;
(function (UserRole) {
  UserRole['GUEST'] = 'guest';
  UserRole['MODERATOR'] = 'moderator';
  UserRole['ADMINISTRATOR'] = 'administrator';
})(UserRole || (UserRole = {}));

// ✅ Use literal types — stripped during transpilation
type UserRole = 'guest' | 'moderator' | 'administrator';

const isGuest = (role: UserRole) => role === 'guest';
```

```ts
// ❌ Avoid enums when iterating
enum USER_ROLES {
  guest = 'guest',
  moderator = 'moderator',
  administrator = 'administrator',
}

// ✅ Use const assertion arrays when iterating
const USER_ROLES = ['guest', 'moderator', 'administrator'] as const;
type UserRole = (typeof USER_ROLES)[number];

const seedDatabase = () => {
  USER_ROLES.forEach((role) => {
    db.roles.insert(role);
  });
};

const insert = (role: UserRole) => { ... }
```

```ts
// ❌ Avoid enums for arbitrary values
enum COLORS {
  primary = '#B33930',
  secondary = '#113A5C',
  brand = '#9C0E7D',
}

// ✅ Use const assertion objects
const COLORS = {
  primary: '#B33930',
  secondary: '#113A5C',
  brand: '#9C0E7D',
} as const;

type Colors = typeof COLORS;
type ColorKey = keyof Colors; // Type "primary" | "secondary" | "brand"
type ColorValue = Colors[ColorKey]; // Type "#B33930" | "#113A5C" | "#9C0E7D"

const setColor = (color: ColorValue) => { ... }
setColor(COLORS.primary);
setColor('#B33930');
```

### Type Union & Boolean Flags

Prefer type unions over multiple boolean flags.

```ts
// ❌ Avoid multiple boolean flags
const isPending, isProcessing, isConfirmed, isExpired;

// ✅ Use type union variable
type UserStatus = 'pending' | 'processing' | 'confirmed' | 'expired';
const userStatus: UserStatus;
```

### Null & Undefined

- `null` — explicitly has no value (assignment, return type).
- `undefined` — value doesn't exist (omitted form fields, excluded from request payload, database queries).

---

## Naming

### Named Exports

Always use named exports.

ESLint rule: `'import/no-default-export': 'error'`

### Naming Conventions

**Variables — camelCase:**
```ts
const products = [...];
const productsFiltered = [...];
```

**Booleans — prefixed with `is`, `has`, `can`, `did`, `will`, etc.:**
```ts
const isDisabled = true;
const hasProduct = false;
```

ESLint rule:
```js
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'variable',
    types: ['boolean'],
    format: ['PascalCase'],
    prefix: ['is', 'are', 'should', 'has', 'can', 'did', 'will'],
  }
]
```

**Constants — UPPER_SNAKE_CASE:**
```ts
const FEATURED_PRODUCT_ID = '8f47d2a1-b13e-4d5a-a7d8-6ef1234';
```

**Object & Array Constants — singular, UPPER_SNAKE_CASE + `as const` (+ `satisfies` when a type exists):**
```ts
const IDLE_ORDER = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
} as const;

const DASHBOARD_ACCESS_ROLES = ['admin', 'editor', 'moderator'] as const;

// With a predefined type:
const IDLE_ORDER = {
  pending: 'idle',
  fulfilled: true,
  error: 'Shipping Error',
} as const satisfies OrderStatus;

const DASHBOARD_ACCESS_ROLES = ['admin', 'editor', 'moderator'] as const satisfies ReadonlyArray<UserRole>;
```

**Functions — camelCase:**
```ts
const filterProductsByType = (...) => { ... };
const formatCurrency = (...) => { ... };
```

**Types — PascalCase:**

ESLint rule:
```js
'@typescript-eslint/naming-convention': [
  'error',
  { selector: 'typeAlias', format: ['PascalCase'] },
]
```

```ts
type OrderStatus = ...;
type ProductItem = ...;
```

**Generics — `T` prefix + descriptive name (never single-letter):**

ESLint rule:
```js
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'typeParameter',
    format: ['PascalCase'],
    custom: { regex: '^T[A-Z]', match: true },
  }
]
```

```ts
// ❌ Avoid single-letter generics
const createPair = <T, K extends string>(first: T, second: K): [T, K] => {
  return [first, second];
};

// ✅ Use descriptive names starting with T
const createPair = <TFirst, TSecond extends string>(first: TFirst, second: TSecond): [TFirst, TSecond] => {
  return [first, second];
};

// ❌ Ambiguous — which 'Request' is which?
const handle = <Request extends Request>(req: Request): void => { ... }

// ✅ Clear with T prefix
const handle = <TRequest extends Request>(req: TRequest): void => { ... }
```

**Abbreviations & Acronyms — capitalize first letter only:**
```ts
// ❌ Avoid
const FAQList = ['qa-1', 'qa-2'];
const generateUserURL = (params) => { ... }

// ✅ Use
const FaqList = ['qa-1', 'qa-2'];
const generateUserUrl = (params) => { ... }
```

Avoid abbreviations unless widely accepted:
```ts
// ❌ Avoid
const GetWin = (params) => { ... }

// ✅ Use
const GetWindow = (params) => { ... }
```

**React Components — PascalCase:** `ProductItem`, `ProductsPage`

**Prop Types — `[ComponentName]Props`:** `ProductItemProps`, `ProductsPageProps`

**Callback Props — `on*` prefix; handler implementations — `handle*` prefix:**

ESLint rule: `'react/jsx-handler-names': ['error', { eventHandlerPrefix: 'handle', eventHandlerPropPrefix: 'on' }]`

```tsx
// ❌ Avoid inconsistent callback prop naming
<Button click={actionClick} />
<MyComponent userSelectedOccurred={triggerUser} />

// ✅ Use prop prefix 'on*' and handler prefix 'handle*'
<Button onClick={handleClick} />
<MyComponent onUserSelected={handleUserSelected} />
```

**React Hooks — `use*` prefix, symmetric `[value, setValue]` pattern:**

ESLint rules: `'react-hooks/rules-of-hooks': 'error'` · `'react/hook-use-state': 'error'`

```ts
// ❌ Avoid inconsistent useState naming
const [userName, setUser] = useState();
const [color, updateColor] = useState();
const [isActive, setActive] = useState();

// ✅ Use
const [name, setName] = useState();
const [color, setColor] = useState();
const [isActive, setIsActive] = useState();
```

Custom hooks must always return an **object**:

```ts
// ❌ Avoid
const [products, errors] = useGetProducts();
const [fontSizes] = useTheme();

// ✅ Use
const { products, errors } = useGetProducts();
const { fontSizes } = useTheme();
```

### Comments

Favor expressive code over comments. Comments should explain **why**, not what or how.

```ts
// ❌ Avoid
// convert to minutes
const m = s * 60;
// avg users per minute
const myAvg = u / m;

// ✅ Use expressive naming
const SECONDS_IN_MINUTE = 60;
const minutes = seconds * SECONDS_IN_MINUTE;
const averageUsersPerMinute = noOfUsers / minutes;

// ✅ Reference planned improvements
// TODO: Move filtering to the backend once API v2 is released.
// Issue/PR - https://github.com/foo/repo/pulls/55124
const filteredUsers = frontendFiltering(selectedUsers);

// ✅ Add context to explain why
// Use Fourier transformation to minimize information loss - https://github.com/dntj/jsfft#usage
const frequencies = signal.FFT();
```

#### TSDoc Comments

Use TSDoc (`/** */`) for APIs, libraries, configurations, and reusable code.

```ts
/**
 * Configuration options for the Web3 SDK.
 */
export type Web3Config = {
  /** Ethereum network chain ID. */
  chainId: number;

  /**
   * Gas price strategy for transactions:
   * - `fast`: Higher fees, faster confirmation
   * - `standard`: Balanced
   * - `slow`: Lower fees, slower confirmation
   */
  gasPriceStrategy: 'fast' | 'standard' | 'slow';

  /** Maximum gas limit per transaction. */
  maxGasLimit?: number;

  /** Enables event listening for smart contract interactions. */
  enableEventListener?: boolean;
};
```

---

## Source Organization

### Code Collocation

- Organize by **feature**, not by file type.
- Collocate code as close as possible to where it's used.
- Deep folder nesting is not an issue.

### Imports

- **Relative imports** (`./`, `../`) for files within the same feature.
- **Absolute imports** (`@common/utils`) for everything else.
- Auto-sort all imports with tooling (e.g., `prettier-plugin-sort-imports`).

```ts
// ❌ Avoid
import { bar, foo } from '../../../../../../distant-folder';

// ✅ Use
import { locationApi } from '@api/locationApi';

import { foo } from '../../foo';
import { bar } from '../bar';
import { baz } from './baz';
```

### Project Structure

**Frontend monorepo:**

```
apps/
├─ product-manager/
│  ├─ common/                   # Truly shared across app — use sparingly
│  │  ├─ components/
│  │  │  ├─ Button/
│  │  │  ├─ ProductTitle/
│  │  │  └─ index.tsx
│  │  ├─ consts/
│  │  │  └─ paths.ts
│  │  ├─ hooks/
│  │  └─ types/
│  ├─ modules/                  # One folder per page/feature
│  │  ├─ HomePage/
│  │  ├─ ProductsPage/
│  │  │  ├─ api/
│  │  │  │  └─ useGetProducts/
│  │  │  ├─ components/
│  │  │  │  ├─ ProductItem/
│  │  │  │  └─ ProductsStatistics/
│  │  │  ├─ utils/
│  │  │  │  └─ filterProductsByType/
│  │  │  └─ index.tsx
│  │  └─ index.tsx
│  ├─ eslint.config.mjs
│  ├─ package.json
│  └─ tsconfig.json
├─ warehouse/
└─ admin-dashboard/
```

**Backend project:**

```
product-manager/
├─ src/
│  ├─ common/
│  │  ├─ consts/
│  │  ├─ middleware/
│  │  └─ types/
│  ├─ modules/
│  │  ├─ admin/
│  │  │  └─ account/
│  │  │     ├─ account.model.ts
│  │  │     ├─ account.controller.ts
│  │  │     ├─ account.route.ts
│  │  │     ├─ account.service.ts
│  │  │     ├─ account.validation.ts
│  │  │     ├─ account.test.ts
│  │  │     └─ index.ts
│  │  └─ general/
│  │     ├─ general.model.ts
│  │     └─ ...
│  └─ ...
├─ eslint.config.mjs
├─ package.json
└─ tsconfig.json
```

---

## Appendix — React

All [function conventions](#functions) apply to React components and hooks.

### Required & Optional Props

**Majority of props should be required.** Introduce optional props only as use cases grow. Ten components with 5 required props each is better than one component that accepts 50 optional props.

### Props as Discriminated Type

Use discriminated unions to eliminate optional props.

```tsx
// ❌ Avoid optional props
type StatusProps = {
  data?: Products;
  title?: string;
  time?: number;
  error?: string;
};

// ✅ Use discriminated union
type StatusSuccess = {
  status: 'success';
  data: Products;
  title: string;
};

type StatusLoading = {
  status: 'loading';
  time: number;
};

type StatusError = {
  status: 'error';
  error: string;
};

type StatusProps = StatusSuccess | StatusLoading | StatusError;

export const Status = (props: StatusProps) => {
  switch (props.status) {
    case 'success':
      return <div>Title {props.title}</div>;
    case 'loading':
      return <div>Loading {props.time}</div>;
    case 'error':
      return <div>Error {props.error}</div>;
  }
};
```

### Props To State

Avoid using props to initialize state. When truly needed, prefix the prop with `initial`.

```ts
// ❌ Avoid props to state
type FooProps = {
  productName: string;
  userId: string;
};

export const Foo = ({ productName, userId }: FooProps) => {
  const [productName, setProductName] = useState(productName);
  ...

// ✅ Prefix with 'initial' when there is a legitimate use case
type FooProps = {
  initialProductName: string;
  userId: string;
};

export const Foo = ({ initialProductName, userId }: FooProps) => {
  const [productName, setProductName] = useState(initialProductName);
  ...
```

### Props Type

Don't use `React.FC` — use typed props argument directly.

```tsx
// ❌ Avoid React.FC
type FooProps = {
  name: string;
  score: number;
};

export const Foo: React.FC<FooProps> = ({ name, score }) => { ... }

// ✅ Use props argument with type
type FooProps = {
  name: string;
  score: number;
};

export const Foo = ({ name, score }: FooProps) => { ... }
```

### Component Types

**Container / Page** (`*Container`, `*Page`) — business logic + API integration:
```
ProductsPage/
├─ api/
│  └─ useGetProducts/
├─ components/
│  └─ ProductItem/
├─ utils/
│  └─ filterProductsByType/
└─ index.tsx
```

**UI Feature** — representational, nested inside container, no API calls:
```
ProductItem/
├─ index.tsx
├─ ProductItem.stories.tsx
└─ ProductItem.test.tsx
```

**UI Design System** — global reusable components:
```
Button/
├─ index.tsx
├─ Button.stories.tsx
└─ Button.test.tsx
```

### Store & Pass Data

- Pass only necessary props to children — not whole objects.
- Store filter/sort/pagination state in the URL. Don't sync URL state with local state.
- Prefer props → URL → composition before reaching for global state.
- Use React compound components for groups of related UI (`menu`, `accordion`, `tabs`, etc.):

```tsx
// PriceList.tsx
const PriceListRoot = ({ children }) => <ul>{children}</ul>;
const PriceListItem = ({ title, amount }) => <li>Name: {title} - Amount: {amount}</li>;

// ❌ Avoid
export const PriceList = {
  Container: PriceListRoot,
  Item: PriceListItem,
};

// ✅ Export compound components correctly
export const PriceList = PriceListRoot as typeof PriceListRoot & {
  Item: typeof PriceListItem;
};
PriceList.Item = PriceListItem;

// App.tsx
<PriceList>
  <PriceList.Item title="Item 1" amount={8} />
  <PriceList.Item title="Item 2" amount={12} />
</PriceList>
```

- UI components show derived state and emit events only — no business logic.
- Data fetching only in container components.
- Encourage server-state libraries (react-query, Apollo Client).
- If global state is truly needed, use Zustand or Context.

---

## Appendix — Tests

### What & How To Test

**Do:**
- Keep tests short, explicit, and immediately visible in intent.
- Follow **AAA pattern**: Arrange → Act → Assert. Minimize both actions and asserts.
- Write pure functions to reduce mocking needs.
- Test business logic as a user would use the app.
- Isolate tests — no shared state, independent execution, own local/session storage.
- Test only publicly exposed interfaces (black-box testing).
- Query HTML elements by stable attributes: role > label > placeholder > text > display value > alt text > title > test ID.

**Don't:**
- Don't test implementation details — refactoring shouldn't break tests.
- Don't re-test libraries/frameworks.
- Don't mandate 100% code coverage.
- Don't test third-party dependencies or external services.

```tsx
// ❌ Avoid — testing just to test
it('should render the user list', () => {
  render(<UserList />);
  expect(screen.getByText('Users List')).toBeInTheDocument();
});
```

### Test Description

All test descriptions must follow `it('should ... when ...')`.

ESLint rule:
```js
'vitest/valid-title': [
  'error',
  {
    mustMatch: { it: [/should.*when/u.source, "Test title must include 'should' and 'when'"] },
  },
]
```

```ts
// ❌ Avoid
it('accepts ISO date format where date is parsed and formatted as YYYY-MM');
it('after title is confirmed user description is rendered');

// ✅ Use
it('should return parsed date as YYYY-MM when input is in ISO date format');
it('should render user description when title is confirmed');
```

### Test Tooling

Use VS Code extensions for fast individual test runs:

```sh
code --install-extension vitest.explorer
code --install-extension ms-playwright.playwright
```

### Snapshots

Avoid snapshot tests — they foster a "just update it" mindset. Exception: short, clearly-intentioned snapshots for critical design system elements that must not deviate.
