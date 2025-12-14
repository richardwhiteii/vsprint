# VSPRINT-001: Project - Initialize Extension Project

## Status
- **Status**: [ ] Not Started
- **Assignee**: —
- **Branch**: `feature/VSPRINT-001-project-setup`
- **Worktree**: `feat-001/`
- **PR**: —

## Ticket Info
| Field | Value |
|-------|-------|
| **Points** | 2pt |
| **Phase** | Phase 1: MVP Core Printing |
| **Dependencies** | None |
| **Parallel With** | — |
| **Priority** | High |

## Source Reference
- **Punchlist**: `PUNCHLIST_001.md`
- **Phase**: Phase 1 - MVP Core Printing
- **Tasks**: 1.1 - Project Initialization

## Git Workflow

### Starting This Ticket
```bash
cd /home/richard/projects/vsprint
git worktree add feat-001 -b feature/VSPRINT-001-project-setup dev
code feat-001
```

### During Implementation
```bash
cd feat-001
git add -A && git commit -m "feat: VSPRINT-001 initialize extension project"
```

### Completing This Ticket
```bash
cd feat-001
git push -u origin feature/VSPRINT-001-project-setup
gh pr create --base dev --title "feat: VSPRINT-001 initialize extension project"
```

### After PR Merged
```bash
cd /home/richard/projects/vsprint
git worktree remove feat-001
cd dev && git pull origin dev
```

## Objective

Create the foundational project structure for the VSPrint extension, including package.json manifest, TypeScript configuration, build system setup with esbuild, and directory structure. This ticket establishes the development environment and build pipeline required for all subsequent feature development.

## Context

VSPrint is a new VS Code extension that provides professional code printing capabilities. This ticket creates the project foundation from scratch in the dev worktree. The extension will use TypeScript for type safety, esbuild for fast bundling, and follow VS Code extension best practices.

The project follows a bare repository + worktree structure where:
- `/home/richard/projects/vsprint/.bare/` contains shared git data
- `/home/richard/projects/vsprint/dev/` is the active development worktree
- Feature worktrees like `feat-001/` are created temporarily for each ticket

This setup enables parallel development and clean branch management.

## Implementation Approach

1. **Directory Structure**: Create `src/` directories for commands, renderers, services, config, and utils as specified in the architecture (PUNCHLIST_context.md lines 178-209)
2. **Package.json**: Define extension manifest with activation events, commands contributions, and dependencies
3. **TypeScript Config**: Configure strict type checking with ES2020 target and VS Code types
4. **Build System**: Setup esbuild for fast bundling with proper source maps
5. **Development Dependencies**: Install TypeScript, VS Code types, esbuild, and testing tools

## Technical Requirements

**Constraints:**
- MUST target VS Code 1.85+ for API compatibility (PUNCHLIST_context.md line 222)
- MUST use TypeScript 5.0+ for modern type features (PUNCHLIST_context.md line 25)
- MUST configure esbuild for efficient bundling (PUNCHLIST_context.md lines 132-134)
- MUST NOT include production dependencies yet (those come in later phases)
- SHOULD keep bundle size considerations in mind (<10MB target, PUNCHLIST_context.md line 221)
- SHOULD use strict TypeScript compiler options for type safety

### Directory Structure to Create
```
/home/richard/projects/vsprint/dev/
├── src/
│   ├── commands/       # CREATE - Command handlers
│   ├── renderers/      # CREATE - Output format renderers
│   ├── services/       # CREATE - Core services
│   ├── config/         # CREATE - Settings management
│   ├── utils/          # CREATE - Utilities
│   └── extension.ts    # CREATE in next ticket (VSPRINT-002)
├── test/               # CREATE - Test files
├── package.json        # CREATE - Extension manifest
├── tsconfig.json       # CREATE - TypeScript config
├── esbuild.config.js   # CREATE - Build config
└── .vscodeignore       # CREATE - Extension packaging exclusions
```

### Package.json Configuration

**Required Fields**:
- `name`: "vsprint"
- `displayName`: "VSPrint - Professional Code Printing"
- `description`: "Print code with syntax highlighting, line numbers, and flexible output options"
- `version`: "0.1.0"
- `publisher`: "richardwhiteii"
- `repository`: "https://github.com/richardwhiteii/vsprint"
- `engines.vscode`: "^1.85.0"
- `categories`: ["Other", "Formatters"]
- `activationEvents`: ["onCommand:vsprint.printFile"]
- `main`: "./dist/extension.js"

**Development Dependencies** (PUNCHLIST_001.md lines 89, PUNCHLIST_context.md lines 30-32):
- `typescript`: "^5.0.0"
- `@types/vscode`: "^1.85.0"
- `@types/node`: "^18.0.0"
- `esbuild`: "^0.19.0"
- `@vscode/test-electron`: "^2.3.0"

**Scripts**:
- `compile`: "esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node"
- `watch`: "npm run compile -- --watch"
- `test`: "node ./test/runTests.js"
- `package`: "vsce package"

### TypeScript Configuration

**tsconfig.json** (PUNCHLIST_001.md lines 86):
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "out",
    "sourceMap": true,
    "strict": true,
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "out", "test"]
}
```

### esbuild Configuration

**esbuild.config.js** (PUNCHLIST_001.md lines 87):
```javascript
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

## Acceptance Criteria

#### AC1: Project Structure Created
- **Given** the dev worktree is empty
- **When** this ticket is implemented
- **Then** all directories (`src/commands/`, `src/renderers/`, `src/services/`, `src/config/`, `src/utils/`, `test/`) exist

#### AC2: Package.json Valid
- **Given** package.json is created
- **When** running `npm install`
- **Then** all dependencies install without errors and extension metadata is valid

#### AC3: TypeScript Configuration Valid
- **Given** tsconfig.json is created
- **When** running `tsc --noEmit`
- **Then** TypeScript compiler validates configuration without errors

#### AC4: Build System Functional
- **Given** esbuild.config.js is created
- **When** running `node esbuild.config.js`
- **Then** build completes (even if src/extension.ts doesn't exist yet, it should error gracefully)

#### AC5: VS Code Extension Structure
- **Given** package.json defines extension manifest
- **When** validating with `vsce package --dry-run`
- **Then** extension structure is valid for VS Code marketplace

## Testing Requirements

### Test Commands
```bash
cd feat-001
npm install
tsc --noEmit          # Validate TypeScript config
npm run compile       # Test build (will fail until VSPRINT-002, expected)
```

### Manual Validation
- [ ] Verify `package.json` has correct engine version "^1.85.0"
- [ ] Verify all directories exist in `src/`
- [ ] Verify TypeScript dependencies installed
- [ ] Check `.vscodeignore` excludes `src/`, `test/`, `tsconfig.json`, `esbuild.config.js`

## AI Implementation Prompt

> **You are implementing project initialization for VSPrint, a VS Code extension that provides professional code printing capabilities.**
>
> **Your Task**:
> 1. Create `package.json` with extension manifest (lines 85, 131 from PUNCHLIST_001.md)
> 2. Create `tsconfig.json` with strict TypeScript configuration (line 86)
> 3. Create `esbuild.config.js` for bundling (line 87)
> 4. Create directory structure: `src/{commands,renderers,services,config,utils}` and `test/` (line 88)
> 5. Create `.vscodeignore` to exclude source files from extension package
> 6. Install dependencies listed in Technical Requirements
>
> **Worktree**: You are working in `feat-001/` worktree
>
> **Architecture Guidelines**:
> - Follow VS Code extension best practices: https://code.visualstudio.com/api
> - Use esbuild for fast bundling (PUNCHLIST_context.md line 37)
> - Directory structure matches PUNCHLIST_context.md lines 178-209
> - Extension must activate on command `onCommand:vsprint.printFile`
>
> **Configuration Details**:
> - Extension name: "vsprint"
> - Display name: "VSPrint - Professional Code Printing"
> - Publisher: "richardwhiteii"
> - Repository: https://github.com/richardwhiteii/vsprint
> - Minimum VS Code version: 1.85.0
> - TypeScript target: ES2020
> - Bundle output: `dist/extension.js`
>
> **Success Criteria**:
> - `npm install` completes successfully
> - `tsc --noEmit` validates TypeScript configuration
> - All required directories exist
> - Package.json has valid extension manifest structure
> - esbuild configuration is ready for extension.ts (created in next ticket)

## Completion Checklist

- [ ] `package.json` created with complete extension manifest
- [ ] `tsconfig.json` created with strict TypeScript config
- [ ] `esbuild.config.js` created with production/watch modes
- [ ] Directory structure created (`src/` subdirectories, `test/`)
- [ ] `.vscodeignore` created
- [ ] Dependencies installed (`npm install` successful)
- [ ] TypeScript validation passes (`tsc --noEmit`)
- [ ] PR created against `dev` branch
- [ ] PR reviewed and merged
- [ ] Worktree removed
- [ ] Ticket marked complete

---

## Completion Record

**Completed**: —
**Actual Effort**: —
**PR**: —

### Files Created/Modified
| File | Lines | Purpose |
|------|-------|---------|
| — | — | — |

### Notes
—
