// Swift API generator (PHASES.md N4).
//
// The framework generator (`node_modules/@basics/core/generate-api.ts`) walks
// the TS checker and emits STRINGS — there is no intermediate representation to
// hang a second backend off. This script keeps the framework's analysis half
// (dummy-service Proxy import + `ts.createProgram` over `tsconfig.server.json`)
// and replaces the emit half with a real type IR plus two backends:
//
//   emitTS    — must reproduce `src/api/*.gen.ts` BYTE-FOR-BYTE. Never written
//               to disk; it exists only as the proof that the IR lost nothing.
//               `bun scripts/generate-swift.ts --verify` runs it and diffs.
//   emitSwift — writes `ios/TapScore/API/Generated/`.
//
// Usage:
//   bun scripts/generate-swift.ts            # verify the IR, then write Swift
//   bun scripts/generate-swift.ts --verify   # only the byte-identity proof
//   bun scripts/generate-swift.ts --no-verify
//
// Transport stays OUT of the generated Swift: each API gets a listing of
// `APIEndpoint<Input, Output>` values (method, path template, path params) that
// the hand-written actor client consumes.

import ts from 'typescript';
import { writeFileSync, readFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();
const apiDir = join(rootDir, 'server/api');
const tsOutDir = join(rootDir, 'src/api');
const swiftOutDir = join(rootDir, 'ios/TapScore/API/Generated');

const args = process.argv.slice(2);
const VERIFY_ONLY = args.includes('--verify');
const SKIP_VERIFY = args.includes('--no-verify');
// `--ref <dir>` diffs against another generator output dir (used to prove the
// clients that exist upstream but have no committed `src/api/*.gen.ts` yet).
const refFlag = args.indexOf('--ref');
const refDir = refFlag >= 0 ? args[refFlag + 1] : null;
// `--allow-missing <name>` (repeatable) waives the oracle requirement for one
// module. Missing oracles are otherwise a HARD failure: silently skipping them
// lets the byte-identity gate disable itself the moment a new API is added.
const ALLOW_MISSING = new Set<string>(
    args.flatMap((a, i) => (a === '--allow-missing' && args[i + 1] ? [args[i + 1]] : [])),
);
// `--dump-enum-names` prints every deduped string enum with the property names
// it rides on and the name it resolved to — how you maintain ENUM_NAME_BY_FIELD.
const DUMP_ENUM_NAMES = args.includes('--dump-enum-names');

function toPascal(stem: string): string {
    return stem
        .split(/[-_]/)
        .filter(Boolean)
        .map((seg) => seg[0].toUpperCase() + seg.slice(1))
        .join('');
}

function fail(msg: string): never {
    throw new Error(`generate-swift: ${msg}`);
}

// ═══ Analysis (same technique as the framework generator) ═══════════════════

interface RuntimeEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    fn: (...args: any[]) => any;
    schema?: unknown;
}

const dummyService = new Proxy({}, { get: () => () => {} });

const configPath = join(rootDir, 'tsconfig.server.json');
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, rootDir);
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();

function unwrapPromise(type: ts.Type): ts.Type {
    const symbol = type.getSymbol();
    if (symbol?.name === 'Promise') {
        const args = checker.getTypeArguments(type as ts.TypeReference);
        if (args.length === 1) return args[0];
    }
    return type;
}

function getArrayElementType(type: ts.Type): ts.Type | null {
    if (!(type.flags & ts.TypeFlags.Object)) return null;
    const symbol = type.getSymbol();
    if (symbol?.name !== 'Array') return null;
    const args = checker.getTypeArguments(type as ts.TypeReference);
    return args.length >= 1 ? args[0] : null;
}

/** True iff `type` can be safely expanded as a standalone named declaration. */
function isInterfaceLike(type: ts.Type): boolean {
    if (type.isUnion() || type.isIntersection()) return false;
    if (!(type.flags & ts.TypeFlags.Object)) return false;
    const symbol = type.getSymbol();
    if (symbol?.name === 'Array' || symbol?.name === 'Promise') return false;
    if (type.getCallSignatures().length > 0) return false;
    return true;
}

/** Name of a named, interface-shaped type declared under `/server/`, else null. */
function serverTypeName(type: ts.Type): string | null {
    const symbol = type.aliasSymbol || type.getSymbol();
    if (!symbol?.declarations?.length) return null;
    const fileName = symbol.declarations[0].getSourceFile().fileName;
    if (!fileName.includes('/server/')) return null;
    const name = symbol.name;
    if (name.startsWith('__') || name === 'default') return null;
    if (!isInterfaceLike(type)) return null;
    return name;
}

function typeOfSymbol(symbol: ts.Symbol): ts.Type {
    const location = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!location) fail(`no declaration for symbol: ${symbol.name}`);
    return checker.getTypeOfSymbolAtLocation(symbol, location);
}

// ═══ The IR ════════════════════════════════════════════════════════════════
//
// Small and TOTAL: every TS type reachable from an endpoint signature must map
// onto exactly one node, and anything that does not is a hard generation
// failure — never a silent `any`. `null` and `undefined` are first-class union
// members (not a nullability flag) because the three-state optionality table
// downstream needs to tell `T?`, `null | T` and `?: null | T` apart.

type TypeIR =
    | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' }
    | { kind: 'stringLiteral'; value: string }
    | { kind: 'numberLiteral'; value: number }
    | { kind: 'booleanLiteral'; value: boolean }
    | { kind: 'null' }
    | { kind: 'undefined' }
    | { kind: 'unknown' }
    | { kind: 'void' }
    | { kind: 'array'; element: TypeIR }
    | { kind: 'named'; name: string }
    | { kind: 'object'; props: PropIR[] }
    | { kind: 'union'; members: TypeIR[] }
    /**
     * Index-signature map. `display` is the checker's own rendering and exists
     * for ONE reason: the framework prints `Record<string, unknown>` when the
     * alias survives and `{ [x: string]: unknown; }` when TypeBox's `Static<>`
     * has already erased it. Same IR, same Swift, different bytes upstream.
     */
    | { kind: 'record'; key: TypeIR; value: TypeIR; display: string };

interface PropIR {
    name: string;
    optional: boolean;
    type: TypeIR;
}

/** Per-module registry of named server types, in discovery order. */
type NamedRegistry = Map<string, ts.Type>;

function toIR(type: ts.Type, named: NamedRegistry): TypeIR {
    if (type.flags & ts.TypeFlags.Void) return { kind: 'void' };
    if (type.flags & ts.TypeFlags.Undefined) return { kind: 'undefined' };
    if (type.flags & ts.TypeFlags.Null) return { kind: 'null' };

    const name = serverTypeName(type);
    if (name) {
        if (!named.has(name)) named.set(name, type);
        return { kind: 'named', name };
    }

    if (checker.isTupleType(type)) {
        fail(
            `tuple types are not representable in the IR (${checker.typeToString(type)}). ` +
            `Use a named object with fields instead.`,
        );
    }

    const el = getArrayElementType(type);
    if (el) return { kind: 'array', element: toIR(el, named) };

    if (type.flags & ts.TypeFlags.Boolean) return { kind: 'primitive', name: 'boolean' };

    if (type.flags & ts.TypeFlags.BooleanLiteral) {
        return { kind: 'booleanLiteral', value: checker.typeToString(type) === 'true' };
    }

    if (type.isUnion()) {
        const boolMembers = type.types.filter((t) => t.flags & ts.TypeFlags.BooleanLiteral);
        // `true | false` is how the checker spells `boolean`; collapse it back,
        // hoisted to the front exactly like the framework does.
        if (boolMembers.length === type.types.length && boolMembers.length > 0) {
            return { kind: 'primitive', name: 'boolean' };
        }
        if (boolMembers.length === 2) {
            const rest = type.types
                .filter((t) => !(t.flags & ts.TypeFlags.BooleanLiteral))
                .map((t) => toIR(t, named));
            return { kind: 'union', members: [{ kind: 'primitive', name: 'boolean' }, ...rest] };
        }
        return { kind: 'union', members: type.types.map((t) => toIR(t, named)) };
    }

    // Intersections are flattened into one object — the framework "prettifies"
    // them the same way, and Swift has no intersection type at all.
    if (type.isIntersection()) return objectIR(type.getProperties(), named);

    if (type.flags & ts.TypeFlags.Object) {
        const props = type.getProperties();
        // A type with BOTH named properties and a string index signature is two
        // shapes at once. The props branch below would keep the props and drop
        // the index signature silently, so refuse instead — the IR is total or
        // it is nothing. (No current server type hits this.)
        if (props.length > 0 && checker.getIndexInfoOfType(type, ts.IndexKind.String)) {
            fail(
                `type '${checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)}' has both ` +
                `named properties and a string index signature; the IR has no node for that combination. ` +
                `Split it into a named object and a separate map in the server contract.`,
            );
        }
        if (props.length > 0 && !type.getCallSignatures().length) return objectIR(props, named);
    }

    if (type.flags & ts.TypeFlags.StringLiteral) {
        return { kind: 'stringLiteral', value: (type as ts.StringLiteralType).value };
    }
    if (type.flags & ts.TypeFlags.NumberLiteral) {
        return { kind: 'numberLiteral', value: (type as ts.NumberLiteralType).value };
    }
    if (type.flags & ts.TypeFlags.String) return { kind: 'primitive', name: 'string' };
    if (type.flags & ts.TypeFlags.Number) return { kind: 'primitive', name: 'number' };
    if (type.flags & ts.TypeFlags.Unknown) return { kind: 'unknown' };

    if (type.flags & ts.TypeFlags.Object) {
        const index = checker.getIndexInfoOfType(type, ts.IndexKind.String);
        if (index) {
            return {
                kind: 'record',
                key: { kind: 'primitive', name: 'string' },
                value: toIR(index.type, named),
                display: checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation),
            };
        }
    }

    const decl = (type.aliasSymbol || type.getSymbol())?.declarations?.[0];
    const where = decl ? decl.getSourceFile().fileName : '<unknown>';
    fail(
        `no IR node for type '${checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)}' ` +
        `(declared in ${where}, flags=${type.flags}). Extend TypeIR deliberately — never widen to any.`,
    );
}

/**
 * Deterministic property order: source declaration position (file, then
 * offset), name as the tiebreak for declaration-less symbols. Mirrors the
 * framework generator (v1.2.1) exactly — `getProperties()` order for
 * anonymous object and intersection types depends on checker cache state,
 * and the byte-identity oracle needs both generators to agree.
 */
function sortProps(props: ts.Symbol[]): ts.Symbol[] {
    return [...props].sort((a, b) => {
        const da = a.declarations?.[0];
        const db = b.declarations?.[0];
        const fa = da ? da.getSourceFile().fileName : '';
        const fb = db ? db.getSourceFile().fileName : '';
        if (fa !== fb) return fa < fb ? -1 : 1;
        const pa = da ? da.getStart() : -1;
        const pb = db ? db.getStart() : -1;
        if (pa !== pb) return pa - pb;
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
}

function objectIR(props: ts.Symbol[], named: NamedRegistry): TypeIR {
    return {
        kind: 'object',
        props: sortProps(props).map((prop) => ({
            name: prop.name,
            optional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
            type: toIR(typeOfSymbol(prop), named),
        })),
    };
}

interface EndpointIR {
    key: string;
    method: string;
    path: string;
    hasInput: boolean;
    input: TypeIR | null;
    output: TypeIR;
}

interface ModuleIR {
    name: string;
    pascal: string;
    endpoints: EndpointIR[];
    /** Named server types in the framework's discovery + expansion order. */
    interfaces: { name: string; type: TypeIR }[];
}

function analyzeModule(
    name: string,
    factory: (svc: any) => Record<string, RuntimeEndpoint>,
): ModuleIR {
    const pascal = toPascal(name);
    const factoryName = `create${pascal}Api`;
    const runtimeApi = factory(dummyService as any);

    const sourceFile = program.getSourceFile(join(apiDir, `${name}.api.ts`));
    if (!sourceFile) fail(`source file not found: ${name}.api.ts`);

    const factoryNode = sourceFile.statements.find(
        (s): s is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(s) && s.name?.text === factoryName,
    );
    if (!factoryNode) fail(`${factoryName} not found in ${sourceFile.fileName}`);

    const fnSymbol = checker.getSymbolAtLocation(factoryNode.name!)!;
    const fnType = checker.getTypeOfSymbolAtLocation(fnSymbol, factoryNode);
    const returnType = checker.getReturnTypeOfSignature(fnType.getCallSignatures()[0]);

    const named: NamedRegistry = new Map();
    const endpoints: EndpointIR[] = [];

    for (const [key, runtime] of Object.entries(runtimeApi)) {
        if (!runtime.method || !runtime.path || typeof runtime.fn !== 'function') {
            fail(`${factoryName}.${key}: invalid endpoint — must have method, path, fn`);
        }
        const hasPathParams = runtime.path.includes(':');
        const hasInput = 'schema' in runtime || hasPathParams;

        const epProp = returnType.getProperty(key);
        if (!epProp) fail(`${factoryName}.${key}: not found in return type`);
        const epType = checker.getTypeOfSymbolAtLocation(epProp, factoryNode);
        const fnPropType = checker.getTypeOfSymbolAtLocation(epType.getProperty('fn')!, factoryNode);
        const sig = fnPropType.getCallSignatures()[0];

        const params = sig.getParameters();
        const takesInput = hasInput && params.length > 0;
        const input = takesInput ? toIR(typeOfSymbol(params[0]), named) : null;

        const awaited = unwrapPromise(checker.getReturnTypeOfSignature(sig));
        // A void handler is `{ ok: true }` on the wire (framework mount.ts).
        const output: TypeIR = awaited.flags & ts.TypeFlags.Void
            ? { kind: 'object', props: [{ name: 'ok', optional: false, type: { kind: 'primitive', name: 'boolean' } }] }
            : toIR(awaited, named);

        endpoints.push({
            key,
            method: runtime.method,
            path: runtime.path,
            hasInput: takesInput,
            input,
            output,
        });
    }

    // Expanding a named type can discover more named types; keep going until
    // the registry stops growing (same fixpoint the framework runs).
    const interfaces: { name: string; type: TypeIR }[] = [];
    const expanded = new Set<string>();
    let changed = true;
    while (changed) {
        changed = false;
        for (const [typeName, type] of named) {
            if (expanded.has(typeName)) continue;
            expanded.add(typeName);
            changed = true;
            if (!isInterfaceLike(type)) {
                const decl = (type.aliasSymbol || type.getSymbol())?.declarations?.[0];
                fail(
                    `cannot expand '${typeName}' (declared in ${decl?.getSourceFile().fileName}) ` +
                    `as an interface — it is a union/intersection/primitive alias.`,
                );
            }
            interfaces.push({ name: typeName, type: objectIR(type.getProperties(), named) });
        }
    }

    return { name, pascal, endpoints, interfaces };
}

// ═══ Emitter 1 — TypeScript (the correctness proof) ════════════════════════
//
// Byte-for-byte reproduction of the framework's `src/api/*.gen.ts`. Every
// oddity below is deliberate mimicry, including the two string-level quirks:
// arrays parenthesise on a naive `|`/`&` substring test, and optional props
// strip `undefined` from the RENDERED string rather than from the type.

function emitTSType(ir: TypeIR): string {
    switch (ir.kind) {
        case 'void': return 'void';
        case 'undefined': return 'undefined';
        case 'null': return 'null';
        case 'unknown': return 'unknown';
        case 'primitive': return ir.name;
        case 'booleanLiteral': return ir.value ? 'true' : 'false';
        case 'numberLiteral': return String(ir.value);
        case 'stringLiteral': return `'${ir.value.replace(/"/g, "'")}'`;
        case 'named': return ir.name;
        case 'record': return ir.display;
        case 'array': {
            const inner = emitTSType(ir.element);
            return inner.includes('|') || inner.includes('&') ? `(${inner})[]` : `${inner}[]`;
        }
        case 'union': return ir.members.map(emitTSType).join(' | ');
        case 'object': return emitTSObjectInline(ir.props);
    }
}

function emitTSProp(prop: PropIR): string {
    const optional = prop.optional ? '?' : '';
    let typeStr = emitTSType(prop.type);
    if (optional) typeStr = typeStr.replace(/ \| undefined$/, '').replace(/^undefined \| /, '');
    return `${prop.name}${optional}: ${typeStr}`;
}

function emitTSObjectInline(props: PropIR[]): string {
    if (props.length === 0) return '{}';
    return `{ ${props.map(emitTSProp).join('; ')} }`;
}

function emitTSInterface(name: string, ir: TypeIR): string {
    if (ir.kind !== 'object') fail(`interface '${name}' is not an object IR`);
    const lines = ir.props.map((p) => `    ${emitTSProp(p)};`);
    return `export interface ${name} {\n${lines.join('\n')}\n}`;
}

function emitTS(mod: ModuleIR): string {
    const Pascal = mod.pascal;
    const interfaceLines: string[] = [];
    const implLines: string[] = [];

    for (const ep of mod.endpoints) {
        const inputParam = ep.hasInput ? `input: ${emitTSType(ep.input!)}` : '';
        interfaceLines.push(`    ${ep.key}(${inputParam}): Promise<${emitTSType(ep.output)}>;`);

        const pathParamNames = [...ep.path.matchAll(/:(\w+)/g)].map((m) => m[1]);
        if (ep.method === 'GET') {
            if (pathParamNames.length > 0) {
                const pathExpr = ep.path.replace(/:(\w+)/g, (_, n) => `\${input.${n}}`);
                implLines.push(`        async ${ep.key}(input) {`);
                implLines.push(`            const pathParams = new Set([${pathParamNames.map((n) => `'${n}'`).join(', ')}]);`);
                implLines.push(`            const params = new URLSearchParams();`);
                implLines.push(`            for (const [k, v] of Object.entries(input as any))`);
                implLines.push(`                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));`);
                implLines.push(`            const qs = params.toString();`);
                implLines.push(`            return apiFetch({ method: 'GET', url: \`\${baseUrl}${pathExpr}\${qs ? '?' + qs : ''}\` });`);
                implLines.push(`        },`);
            } else if (ep.hasInput) {
                implLines.push(`        async ${ep.key}(input) {`);
                implLines.push(`            const params = new URLSearchParams();`);
                implLines.push(`            for (const [k, v] of Object.entries(input as any))`);
                implLines.push(`                if (v !== undefined) params.set(k, String(v));`);
                implLines.push(`            const qs = params.toString();`);
                implLines.push(`            return apiFetch({ method: 'GET', url: \`\${baseUrl}${ep.path}\${qs ? '?' + qs : ''}\` });`);
                implLines.push(`        },`);
            } else {
                implLines.push(`        async ${ep.key}() {`);
                implLines.push(`            return apiFetch({ method: 'GET', url: \`\${baseUrl}${ep.path}\` });`);
                implLines.push(`        },`);
            }
        } else if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
            if (pathParamNames.length > 0) {
                const pathExpr = ep.path.replace(/:(\w+)/g, (_, n) => `\${input.${n}}`);
                implLines.push(`        async ${ep.key}(input) {`);
                implLines.push(`            const pathParams = new Set([${pathParamNames.map((n) => `'${n}'`).join(', ')}]);`);
                implLines.push(`            const body: Record<string, unknown> = {};`);
                implLines.push(`            for (const [k, v] of Object.entries(input as any))`);
                implLines.push(`                if (!pathParams.has(k)) body[k] = v;`);
                implLines.push(`            return apiFetch({ method: '${ep.method}', url: \`\${baseUrl}${pathExpr}\`, body });`);
                implLines.push(`        },`);
            } else {
                implLines.push(`        async ${ep.key}(${ep.hasInput ? 'input' : ''}) {`);
                implLines.push(`            return apiFetch({ method: '${ep.method}', url: \`\${baseUrl}${ep.path}\`, body: ${ep.hasInput ? 'input' : '{}'} });`);
                implLines.push(`        },`);
            }
        } else if (ep.method === 'DELETE') {
            const pathExpr = ep.path.replace(/:(\w+)/g, (_, n) => `\${input.${n}}`);
            implLines.push(`        async ${ep.key}(input) {`);
            implLines.push(`            return apiFetch({ method: 'DELETE', url: \`\${baseUrl}${pathExpr}\` });`);
            implLines.push(`        },`);
        }
    }

    const declarations = mod.interfaces.map((i) => emitTSInterface(i.name, i.type));
    const typesBlock = declarations.length > 0 ? '\n' + declarations.join('\n\n') + '\n' : '';

    return `// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';
${typesBlock}
export interface ${Pascal}Api {
${interfaceLines.join('\n')}
}

export function create${Pascal}Client(baseUrl: string): ${Pascal}Api {
    return {
${implLines.join('\n')}
    };
}
`;
}

// ═══ Emitter 2 — Swift ═════════════════════════════════════════════════════

const SWIFT_KEYWORDS = new Set([
    'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import',
    'init', 'inout', 'internal', 'let', 'open', 'operator', 'private', 'precedencegroup',
    'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript', 'typealias', 'var',
    'break', 'case', 'catch', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough',
    'for', 'guard', 'if', 'in', 'repeat', 'return', 'throw', 'throws', 'switch', 'where',
    'while', 'as', 'false', 'is', 'nil', 'self', 'Self', 'super', 'true', 'try', 'Any',
    'Protocol', 'Type', 'associativity', 'convenience', 'dynamic', 'didSet', 'final', 'get',
    'infix', 'indirect', 'lazy', 'left', 'mutating', 'none', 'nonmutating', 'optional',
    'override', 'postfix', 'prefix', 'required', 'right', 'set', 'some', 'unowned', 'weak',
    'willSet', 'actor', 'async', 'await', 'borrowing', 'consuming', 'each', 'macro',
]);

/** Type names that would shadow something important if we minted them. */
const RESERVED_TYPE_NAMES = new Set([
    'Any', 'AnyObject', 'Array', 'Bool', 'Character', 'Codable', 'Data', 'Date', 'Decodable',
    'Dictionary', 'Double', 'Encodable', 'Equatable', 'Error', 'Hashable', 'Int', 'Never',
    'Optional', 'Protocol', 'Result', 'Self', 'Sendable', 'Set', 'String', 'Task', 'Type',
    'URL', 'Void', 'JSONValue', 'TriState', 'APIEndpoint', 'EmptyInput', 'HTTPMethod',
]);

function escapeIdent(name: string): string {
    // Backticks rescue keywords, nothing else. A TS property named `foo-bar` or
    // `2nd` would emit Swift that does not compile, and a generator that emits
    // broken code is worse than one that stops. (`CodingKeys` already carries
    // the wire name, so a sanitising rename is possible later — refusing is
    // enough while no server type needs it.)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        fail(
            `property name '${name}' is not a Swift identifier and cannot be emitted. ` +
            `Rename it in the server contract.`,
        );
    }
    return SWIFT_KEYWORDS.has(name) ? `\`${name}\`` : name;
}

function pascalFromToken(token: string): string {
    const cleaned = token.replace(/[^A-Za-z0-9]+/g, ' ').trim();
    if (!cleaned) return 'Value';
    // Preserve existing camelCase humps; only upper the first letter of segments.
    return cleaned
        .split(' ')
        .map((seg) => seg[0].toUpperCase() + seg.slice(1))
        .join('');
}

function camelFromToken(token: string): string {
    const p = pascalFromToken(token);
    let out = p[0].toLowerCase() + p.slice(1);
    if (/^[0-9]/.test(out)) out = `v${p}`;
    return out;
}

/** Canonical, order-preserving key used for structural dedupe. */
function irKey(ir: TypeIR): string {
    switch (ir.kind) {
        case 'primitive': return `p:${ir.name}`;
        case 'stringLiteral': return `s:${ir.value}`;
        case 'numberLiteral': return `n:${ir.value}`;
        case 'booleanLiteral': return `b:${ir.value}`;
        case 'null': return 'null';
        case 'undefined': return 'undef';
        case 'unknown': return 'unknown';
        case 'void': return 'void';
        case 'array': return `[${irKey(ir.element)}]`;
        case 'named': return `@${ir.name}`;
        case 'record': return `map(${irKey(ir.key)},${irKey(ir.value)})`;
        // Sorted: union member order is type-id order, which is not stable
        // across runs. Two unions over the same members are one Swift type.
        case 'union': return `(${ir.members.map(irKey).sort().join('|')})`;
        case 'object':
            return `{${ir.props.map((p) => `${p.name}${p.optional ? '?' : ''}:${irKey(p.type)}`).join(';')}}`;
    }
}

type Optionality = 'plain' | 'optional' | 'nullable' | 'tristate';

interface SwiftField {
    tsName: string;
    swiftName: string;
    type: string;
    optionality: Optionality;
    /**
     * Swift literal expression for a required single-literal property (the
     * discriminant tag of a union variant, `type: 'split'`). Such a field is a
     * `let` with a fixed value and is left out of the memberwise init, so a
     * struct carrying the wrong tag is unrepresentable. Decoding still reads
     * and type-checks the key, so decode behaviour is unchanged.
     */
    constant: string | null;
}

interface SwiftDecl {
    name: string;
    module: string;
    text: string;
}

const swiftDecls: SwiftDecl[] = [];
/** structural key → minted Swift type name (global; one Swift module). */
const declByKey = new Map<string, string>();
const takenNames = new Set<string>(RESERVED_TYPE_NAMES);
/** TS interface name → Swift name, so `Round` is declared exactly once. */
const namedModels = new Map<string, string>();
/** TS interface name → its IR, for discriminant lookups through `named` refs. */
const namedIR = new Map<string, TypeIR>();

let currentModule = '';

// ── stable names for deduplicated string enums ─────────────────────────────
//
// A string-literal union is structurally deduped: `visibility: 'private' |
// 'friends' | 'link'` on `Round` and on `AdminRoundSummary` is ONE Swift enum.
// Naming it after whichever struct happened to be emitted first makes the name
// a function of the schema's shape everywhere else: adding `visibility` to an
// unrelated admin route renamed `RoundVisibility` to `AdminRoundSummaryVisibility`
// and broke hand-written app code that referenced it.
//
// So the name is resolved from the WHOLE schema before any body is emitted
// (see `resolveStableEnumNames`), out of the property name(s) the enum appears
// under — a property of the enum itself, not of its neighbours.

interface UnionSite {
    /** Property names the union appears under, across every declaration site. */
    fields: Set<string>;
    /** Full path hints (`AdminRoundSummaryVisibility`), the fallback name pool. */
    hints: Set<string>;
}

/** structural key → every site that asked for it. Filled by the collect pass. */
const unionSites = new Map<string, UnionSite>();
/** structural key → its case values, for the keys that are String-backed enums. */
const stringEnumValues = new Map<string, string[]>();
/** structural key → resolved name. Empty during the collect pass. */
const stableEnumNames = new Map<string, string>();

function recordUnionSite(key: string, hint: string, field: string | null): void {
    let site = unionSites.get(key);
    if (!site) {
        site = { fields: new Set(), hints: new Set() };
        unionSites.set(key, site);
    }
    if (field) site.fields.add(field);
    site.hints.add(hint);
}

/**
 * Explicit names for enums whose property name alone is a poor module-global
 * Swift type. `Pascal(field)` is right for `visibility` → `Visibility`, and
 * wrong for `key` → `Key`: the generated code shares ONE Swift module with the
 * whole app, so a bare common word is a name collision waiting to happen.
 *
 * Keys, tried in this order: `property:everyValue,inOrder` (needed only when
 * two enums on one property share a first case), `property#firstValue` (two
 * enums on one property), plain `property`. Being hand-written is the point —
 * a pinned name cannot be moved by a schema edit anywhere.
 *
 * Add an entry when a new enum resolves to a single generic word. Run
 * `bun run generate:swift --dump-enum-names` to see what resolved to what.
 */
const ENUM_NAME_BY_FIELD: Record<string, string> = {
    aggregate: 'GridRowAggregate',
    'ballMode:own,team': 'FormatSlotBallMode',
    'ballMode:own,team,any': 'FormatBallRequirementBallMode',
    'code#illegal_transition': 'CompetitionRefusalCode',
    'code#missing_holes': 'CourseIssueCode',
    componentId: 'ScoreGridComponentId',
    direction: 'ResultViewDirection',
    eventType: 'ScoreEventEventType',
    gender: 'PlayerGender',
    groups: 'StartListGroupsPolicy',
    key: 'StatEventKey',
    'kind#number': 'MetadataInputKind',
    'kind#par': 'GridRowKind',
    'kind#player': 'IdentityRefKind',
    'kind#single_ball': 'DraftTeamKind',
    lifecycle: 'CompetitionLifecycle',
    mode: 'RouteSiMode',
    presetId: 'StartListPresetId',
    providers: 'AuthProvider',
    'reason#rank': 'CutDecisionEntryReason',
    'reason#round_complete': 'SetupNotEditableReason',
    role: 'RoleGrantRole',
    seats: 'StartListSeatsPolicy',
    severity: 'CourseIssueSeverity',
    'source#flat': 'AllowanceSource',
    'source#manual': 'HandicapEntrySource',
    startList: 'StartListShape',
    'status#active': 'RoundStatus',
    'status#counted': 'CompetitionRoundCellStatus',
    'target#ball_hole': 'RulingTarget',
    'target#producer_tee': 'SetupCorrectionTarget',
    team: 'GridRowTeam',
    template: 'CellMarkerTemplate',
    tone: 'GridCellTone',
    topology: 'FormatBallTopology',
    type: 'RoutePolicyType',
    visibility: 'RoundVisibility',
};

/**
 * Pick a name for every deduped string enum, as a pure function of the sites
 * collected across all modules — no dependence on emission order.
 *
 *   1. An explicit `ENUM_NAME_BY_FIELD` pin wins.
 *   2. An enum used under exactly ONE property name is named after it
 *      (`visibility` → `Visibility`), whatever structs carry it.
 *   3. Otherwise — several property names, none at all (an enum inside an
 *      array or a map value), or a property name two different enums both
 *      claim — the first case value qualifies the property name:
 *      `kind: 'single_ball' | 'multi_ball'` → `SingleBallKind`.
 *
 * Rule 3 is deliberately NOT "the shortest path hint": a path hint is built
 * from the enclosing struct's minted name, and anonymous structs are still
 * named first-emitter-wins, so hint-derived names inherit exactly the
 * order-dependence this function exists to remove. Property names and case
 * values belong to the enum itself, and nothing else in the schema can move
 * them. Rule-3 names read plainly rather than well — pin the ones that matter.
 */
function resolveStableEnumNames(taken: Iterable<string>): void {
    const sorted = [...stringEnumValues.keys()].sort();
    const pinFor = (key: string) => {
        const values = stringEnumValues.get(key)!;
        for (const field of [...unionSites.get(key)!.fields].sort()) {
            const pin = ENUM_NAME_BY_FIELD[`${field}:${values.join(',')}`]
                ?? ENUM_NAME_BY_FIELD[`${field}#${values[0]}`]
                ?? ENUM_NAME_BY_FIELD[field];
            if (pin) return pin;
        }
        return null;
    };
    const qualified = (key: string) => {
        const fields = [...unionSites.get(key)!.fields].sort();
        return `${pascalFromToken(stringEnumValues.get(key)![0])}${fields.map(pascalFromToken).join('')}`;
    };
    const preferred = new Map<string, string>();
    for (const key of sorted) {
        const fields = [...unionSites.get(key)!.fields];
        preferred.set(
            key,
            pinFor(key) ?? (fields.length === 1 ? pascalFromToken(fields[0]) : qualified(key)),
        );
    }
    // A name two enums both want belongs to neither.
    const claims = new Map<string, number>();
    for (const name of preferred.values()) claims.set(name, (claims.get(name) ?? 0) + 1);
    for (const key of sorted) {
        if (claims.get(preferred.get(key)!)! > 1) preferred.set(key, qualified(key));
    }
    // Named models own their names outright — they are minted from the server
    // interface name, which no unrelated schema edit can move.
    const used = new Set<string>(taken);
    for (const key of sorted) {
        let base = pascalFromToken(preferred.get(key)!);
        if (RESERVED_TYPE_NAMES.has(base)) base = `${base}Model`;
        let name = base;
        for (let i = 2; used.has(name); i++) name = `${base}${i}`;
        used.add(name);
        stableEnumNames.set(key, name);
    }
    if (DUMP_ENUM_NAMES) {
        for (const key of sorted) {
            const site = unionSites.get(key)!;
            console.error(
                `${stableEnumNames.get(key)!.padEnd(32)} fields=[${[...site.fields].sort().join(',')}] ` +
                `values=[${stringEnumValues.get(key)!.join(',')}]`,
            );
        }
    }
}

function mintName(preferred: string): string {
    let base = pascalFromToken(preferred);
    if (RESERVED_TYPE_NAMES.has(base)) base = `${base}Model`;
    if (!takenNames.has(base)) {
        takenNames.add(base);
        return base;
    }
    for (let i = 2; ; i++) {
        const candidate = `${base}${i}`;
        if (!takenNames.has(candidate)) {
            takenNames.add(candidate);
            return candidate;
        }
    }
}

function push(name: string, text: string): void {
    swiftDecls.push({ name, module: currentModule, text });
}

// ── optionality table ──────────────────────────────────────────────────────
//
//   null | T      → T?  with an EXPLICIT encodeNil. Never encodeIfPresent:
//                   `strokes: null` means "score cleared", and dropping the
//                   key would silently turn a clear into a no-op.
//   T? (TS `?:`)  → T?  with encodeIfPresent — absent really is absent.
//   ?: null | T   → TriState<T> — absent, null and a value are three distinct
//                   wire states and the server distinguishes all three.

function splitNullability(ir: TypeIR): { base: TypeIR; hasNull: boolean } {
    if (ir.kind !== 'union') return { base: ir, hasNull: false };
    const hasNull = ir.members.some((m) => m.kind === 'null');
    const rest = ir.members.filter((m) => m.kind !== 'null' && m.kind !== 'undefined');
    if (rest.length === 0) fail(`union with no non-null members: ${irKey(ir)}`);
    return { base: rest.length === 1 ? rest[0] : { kind: 'union', members: rest }, hasNull };
}

function constantFor(prop: PropIR): string | null {
    if (prop.optional) return null;
    if (prop.type.kind === 'stringLiteral') return `"${prop.type.value}"`;
    if (prop.type.kind === 'booleanLiteral') return prop.type.value ? 'true' : 'false';
    return null;
}

function fieldFor(prop: PropIR, hint: string): SwiftField {
    const { base, hasNull } = splitNullability(prop.type);
    const inner = swiftType(base, hint, prop.name);
    const constant = constantFor(prop);
    let optionality: Optionality;
    let type: string;
    if (prop.optional && hasNull) {
        optionality = 'tristate';
        type = `TriState<${inner}>`;
    } else if (prop.optional) {
        optionality = 'optional';
        type = `${inner}?`;
    } else if (hasNull) {
        optionality = 'nullable';
        type = `${inner}?`;
    } else {
        optionality = 'plain';
        type = inner;
    }
    return { tsName: prop.name, swiftName: escapeIdent(prop.name), type, optionality, constant };
}

function defaultForField(f: SwiftField): string | null {
    if (f.optionality === 'tristate') return '.absent';
    if (f.optionality === 'optional' || f.optionality === 'nullable') return 'nil';
    return null;
}

function emitStruct(name: string, props: PropIR[], hint: string): string {
    const fields = props.map((p) => fieldFor(p, `${hint}${pascalFromToken(p.name)}`));
    const L: string[] = [];
    L.push(`struct ${name}: Codable, Sendable, Equatable {`);
    for (const f of fields) {
        if (f.constant) L.push(`    let ${f.swiftName}: ${f.type} = ${f.constant}`);
        else L.push(`    var ${f.swiftName}: ${f.type}`);
    }
    if (fields.length === 0) {
        L.push(`    init() {}`);
        L.push(`}`);
        return L.join('\n');
    }
    L.push('');
    L.push(`    enum CodingKeys: String, CodingKey {`);
    for (const f of fields) L.push(`        case ${f.swiftName} = "${f.tsName}"`);
    L.push(`    }`);
    L.push('');
    // Memberwise init (declaring init(from:) would otherwise suppress it).
    // Constant tag fields are omitted — they have exactly one legal value.
    const settable = fields.filter((f) => !f.constant);
    const params = settable.map((f) => {
        const d = defaultForField(f);
        return `${f.swiftName}: ${f.type}${d ? ` = ${d}` : ''}`;
    });
    L.push(`    init(${params.join(', ')}) {`);
    for (const f of settable) L.push(`        self.${f.swiftName} = ${f.swiftName}`);
    L.push(`    }`);
    L.push('');
    L.push(`    init(from decoder: any Decoder) throws {`);
    L.push(`        let c = try decoder.container(keyedBy: CodingKeys.self)`);
    for (const f of fields) {
        const bare = f.type.replace(/\?$/, '');
        if (f.constant) {
            // Read it so a wrong type / missing key still throws exactly as it
            // did before; the stored value is fixed by the declaration.
            L.push(`        _ = try c.decode(${f.type}.self, forKey: .${f.swiftName})`);
            continue;
        }
        switch (f.optionality) {
            case 'plain':
                L.push(`        self.${f.swiftName} = try c.decode(${f.type}.self, forKey: .${f.swiftName})`);
                break;
            case 'optional':
            case 'nullable':
                L.push(`        self.${f.swiftName} = try c.decodeIfPresent(${bare}.self, forKey: .${f.swiftName})`);
                break;
            case 'tristate': {
                const wrapped = f.type.slice('TriState<'.length, -1);
                L.push(`        if c.contains(.${f.swiftName}) {`);
                L.push(`            self.${f.swiftName} = try c.decodeNil(forKey: .${f.swiftName})`);
                L.push(`                ? .null`);
                L.push(`                : .value(try c.decode(${wrapped}.self, forKey: .${f.swiftName}))`);
                L.push(`        } else {`);
                L.push(`            self.${f.swiftName} = .absent`);
                L.push(`        }`);
                break;
            }
        }
    }
    L.push(`    }`);
    L.push('');
    L.push(`    func encode(to encoder: any Encoder) throws {`);
    L.push(`        var c = encoder.container(keyedBy: CodingKeys.self)`);
    for (const f of fields) {
        switch (f.optionality) {
            case 'plain':
                L.push(`        try c.encode(${f.swiftName}, forKey: .${f.swiftName})`);
                break;
            case 'optional':
                L.push(`        try c.encodeIfPresent(${f.swiftName}, forKey: .${f.swiftName})`);
                break;
            case 'nullable':
                // `null` is DATA here, not absence — write the key either way.
                L.push(`        if let ${f.swiftName} {`);
                L.push(`            try c.encode(${f.swiftName}, forKey: .${f.swiftName})`);
                L.push(`        } else {`);
                L.push(`            try c.encodeNil(forKey: .${f.swiftName})`);
                L.push(`        }`);
                break;
            case 'tristate':
                L.push(`        switch ${f.swiftName} {`);
                L.push(`        case .absent: break`);
                L.push(`        case .null: try c.encodeNil(forKey: .${f.swiftName})`);
                L.push(`        case .value(let v): try c.encode(v, forKey: .${f.swiftName})`);
                L.push(`        }`);
                break;
        }
    }
    L.push(`    }`);
    L.push(`}`);
    return L.join('\n');
}

// ── string-literal unions → String-backed enums ────────────────────────────

function enumCaseName(value: string, used: Set<string>): string {
    let name = camelFromToken(value);
    if (!name) name = 'value';
    if (SWIFT_KEYWORDS.has(name)) name = `\`${name}\``;
    let candidate = name;
    let i = 2;
    while (used.has(candidate)) candidate = `${name}${i++}`;
    used.add(candidate);
    return candidate;
}

function emitStringEnum(name: string, values: string[]): string {
    const used = new Set<string>();
    const L = [`enum ${name}: String, Codable, Sendable, Equatable {`];
    for (const v of values) L.push(`    case ${enumCaseName(v, used)} = "${v}"`);
    L.push(`}`);
    return L.join('\n');
}

// ── discriminated unions → enums with a payload per case ───────────────────

interface VariantInfo {
    ir: TypeIR;
    props: PropIR[];
    /** literal values of the discriminant key for this variant */
    values: (string | boolean)[];
}

function objectPropsOf(ir: TypeIR): PropIR[] | null {
    if (ir.kind === 'object') return ir.props;
    if (ir.kind === 'named') {
        const target = namedIR.get(ir.name);
        if (target && target.kind === 'object') return target.props;
    }
    return null;
}

function literalValuesOf(ir: TypeIR): (string | boolean)[] | null {
    if (ir.kind === 'stringLiteral') return [ir.value];
    if (ir.kind === 'booleanLiteral') return [ir.value];
    if (ir.kind === 'union') {
        const out: (string | boolean)[] = [];
        for (const m of ir.members) {
            if (m.kind === 'stringLiteral') out.push(m.value);
            else if (m.kind === 'booleanLiteral') out.push(m.value);
            else return null;
        }
        return out.length ? out : null;
    }
    return null;
}

/**
 * Pick the discriminant key: a key present and literal-typed on EVERY variant.
 * Not hardcoded to `ok` — `editable`, `unchanged` and `kind` all show up.
 * Prefer the key that splits the union furthest.
 */
function pickDiscriminant(variants: { props: PropIR[] }[]): { key: string; values: (string | boolean)[][] } | null {
    const candidateKeys = variants[0].props
        .filter((p) => !p.optional && literalValuesOf(p.type) !== null)
        .map((p) => p.name);
    let best: { key: string; values: (string | boolean)[][]; groups: number } | null = null;
    for (const key of candidateKeys) {
        const values: (string | boolean)[][] = [];
        let ok = true;
        for (const v of variants) {
            const prop = v.props.find((p) => p.name === key && !p.optional);
            const lits = prop ? literalValuesOf(prop.type) : null;
            if (!lits) { ok = false; break; }
            values.push(lits);
        }
        if (!ok) continue;
        // Values must be pairwise disjoint across variants to be usable at all.
        const seen = new Set<string>();
        let disjoint = true;
        for (const set of values) for (const v of set) {
            const k = `${typeof v}:${v}`;
            if (seen.has(k)) { disjoint = false; }
            seen.add(k);
        }
        const groups = new Set(values.map((s) => s.map(String).sort().join(','))).size;
        if (!disjoint && groups === values.length) continue;
        const score = disjoint ? values.length : groups;
        if (!best || score > best.groups) best = { key, values, groups: score };
    }
    return best ? { key: best.key, values: best.values } : null;
}

/**
 * Within a group of variants sharing a discriminant value (the competitions
 * `{ ok: false; refusal }` vs `{ ok: false; diagnostics }` case), find a
 * required key that exists on exactly one variant of the group.
 */
function presenceKeys(group: VariantInfo[]): string[] | null {
    const keys: string[] = [];
    for (let i = 0; i < group.length; i++) {
        const mine = group[i].props.filter((p) => !p.optional).map((p) => p.name);
        const others = group.filter((_, j) => j !== i).map((v) => new Set(v.props.map((p) => p.name)));
        const unique = mine.find((k) => others.every((o) => !o.has(k)));
        if (!unique) return null;
        keys.push(unique);
    }
    return keys;
}

function caseNameForVariant(
    key: string,
    values: (string | boolean)[],
    presenceKey: string | null,
    multiIndex: number,
    used: Set<string>,
): string {
    let base: string;
    if (values.length === 1 && typeof values[0] === 'string') {
        base = camelFromToken(values[0]);
    } else if (values.length === 1) {
        base = values[0] === true ? camelFromToken(key) : `not${pascalFromToken(key)}`;
    } else {
        // Multi-literal variant (marker `template` is the live case): there is
        // no single value to name it after.
        base = multiIndex === 0 ? 'other' : `other${multiIndex + 1}`;
    }
    if (presenceKey) base = `${base}${pascalFromToken(presenceKey)}`;
    let name = base;
    let i = 2;
    while (used.has(name)) name = `${base}${i++}`;
    used.add(name);
    return SWIFT_KEYWORDS.has(name) ? `\`${name}\`` : name;
}

/** The JSON shape a member occupies — two members of the same shape need a tag. */
function jsonShape(ir: TypeIR): 'string' | 'number' | 'boolean' | 'array' | 'object' | 'map' {
    switch (ir.kind) {
        case 'stringLiteral': return 'string';
        case 'numberLiteral': return 'number';
        case 'booleanLiteral': return 'boolean';
        case 'primitive': return ir.name;
        case 'array': return 'array';
        case 'record': return 'map';
        case 'object': case 'named': return 'object';
        case 'unknown': return 'object';
        default: return 'object';
    }
}

/**
 * A union whose members occupy DIFFERENT JSON shapes (`'par' | { perHole }`)
 * needs no tag — the shapes themselves discriminate, and a decoder can simply
 * try them in order. String literals collapse into one shape slot.
 */
function emitShapeUnion(name: string, members: TypeIR[], hint: string): string {
    const literals = members.filter((m) => m.kind === 'stringLiteral') as Extract<TypeIR, { kind: 'stringLiteral' }>[];
    const others = members.filter((m) => m.kind !== 'stringLiteral');

    interface ShapeCase { caseName: string; payload: string | null; decode: string; encode: string }
    const cases: ShapeCase[] = [];
    const used = new Set<string>();

    // Each attempt records WHY it failed. A bare "no variant matched" tells the
    // caller nothing about which shape was closest or what was wrong with it.
    const label = (caseName: string) => caseName.replace(/`/g, '');

    if (literals.length === 1) {
        const value = literals[0].value;
        const caseName = enumCaseName(value, used);
        cases.push({
            caseName,
            payload: null,
            decode:
                `        do {\n` +
                `            let raw = try decoder.singleValueContainer().decode(String.self)\n` +
                `            if raw == "${value}" {\n` +
                `                self = .${caseName}\n` +
                `                return\n` +
                `            }\n` +
                `            errors.append("${label(caseName)}: expected ${value}, got \\(raw)")\n` +
                `        } catch {\n` +
                `            errors.append("${label(caseName)}: \\(error)")\n` +
                `        }`,
            encode:
                `        case .${caseName}:\n` +
                `            var c = encoder.singleValueContainer()\n` +
                `            try c.encode("${value}")`,
        });
    } else if (literals.length > 1) {
        const enumName = mintName(`${hint}Kind`);
        push(enumName, emitStringEnum(enumName, literals.map((l) => l.value)));
        const caseName = enumCaseName('literal', used);
        cases.push({
            caseName,
            payload: enumName,
            decode:
                `        do {\n` +
                `            self = .${caseName}(try decoder.singleValueContainer().decode(${enumName}.self))\n` +
                `            return\n` +
                `        } catch {\n` +
                `            errors.append("${label(caseName)}: \\(error)")\n` +
                `        }`,
            encode:
                `        case .${caseName}(let v):\n` +
                `            var c = encoder.singleValueContainer()\n` +
                `            try c.encode(v)`,
        });
    }

    for (const member of others) {
        const shape = jsonShape(member);
        const payload = swiftType(member, `${hint}${pascalFromToken(shape)}`);
        const caseName = enumCaseName(shape, used);
        cases.push({
            caseName,
            payload,
            decode:
                `        do {\n` +
                `            self = .${caseName}(try ${payload}(from: decoder))\n` +
                `            return\n` +
                `        } catch {\n` +
                `            errors.append("${label(caseName)}: \\(error)")\n` +
                `        }`,
            encode: `        case .${caseName}(let v): try v.encode(to: encoder)`,
        });
    }

    const L: string[] = [];
    L.push(`enum ${name}: Codable, Sendable, Equatable {`);
    for (const c of cases) L.push(`    case ${c.caseName}${c.payload ? `(${c.payload})` : ''}`);
    L.push('');
    L.push(`    init(from decoder: any Decoder) throws {`);
    L.push(`        var errors: [String] = []`);
    for (const c of cases) L.push(c.decode);
    L.push(`        throw DecodingError.dataCorrupted(.init(`);
    L.push(`            codingPath: decoder.codingPath,`);
    L.push(`            debugDescription: "no ${name} variant matched — "`);
    L.push(`                + errors.joined(separator: " | ")))`);
    L.push(`    }`);
    L.push('');
    L.push(`    func encode(to encoder: any Encoder) throws {`);
    L.push(`        switch self {`);
    for (const c of cases) L.push(c.encode);
    L.push(`        }`);
    L.push(`    }`);
    L.push(`}`);
    return L.join('\n');
}

/**
 * A union over object variants. Three discrimination strategies, in order:
 *
 *  1. a literal-typed key present on every variant (`ok`, `editable`,
 *     `unchanged`, `kind`, `template` — detected, never hardcoded);
 *  2. required-key PRESENCE, for variants a literal cannot separate — this is
 *     the competitions `{ ok: false; refusal }` vs `{ ok: false; diagnostics }`
 *     pair, and also untagged pairs like `{ producerDefId } | { teamId }`;
 *  3. nothing — GENERATION FAILS. A decoder that guesses is worse than a
 *     generator that stops.
 */
function emitUnionEnum(name: string, members: TypeIR[], hint: string): string {
    const variants: VariantInfo[] = members.map((m) => {
        const props = objectPropsOf(m);
        if (!props) {
            fail(
                `cannot represent union member '${irKey(m)}' in '${name}': Swift unions are ` +
                `generated only over object variants.`,
            );
        }
        return { ir: m, props, values: [] };
    });

    const disc = pickDiscriminant(variants);
    if (disc) variants.forEach((v, i) => { v.values = disc.values[i]; });

    // Group variants a literal cannot separate; each group falls back to
    // presence. With no discriminant at all there is exactly one group.
    const groups = new Map<string, VariantInfo[]>();
    for (const v of variants) {
        const k = disc ? v.values.map(String).sort().join(',') : '*';
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(v);
    }

    const groupPresence = new Map<VariantInfo, string | null>();
    for (const group of groups.values()) {
        if (group.length === 1) {
            groupPresence.set(group[0], null);
            continue;
        }
        const keys = presenceKeys(group);
        if (!keys) {
            const shapes = group.map((v) => `{${v.props.map((p) => p.name).join(',')}}`).join(' | ');
            fail(
                `union '${name}' cannot be discriminated: ` +
                (disc
                    ? `variants sharing '${disc.key}' = ${group[0].values.map(String).join('|')} `
                    : `no key is literal-typed on every variant, and `) +
                `no required key is unique to one variant (${shapes}). ` +
                `Add a distinguishing literal tag to the server contract.`,
            );
        }
        group.forEach((v, i) => groupPresence.set(v, keys[i]));
    }

    interface CaseInfo { variant: VariantInfo; caseName: string; payload: string; presenceKey: string | null }
    const cases: CaseInfo[] = [];
    const usedCaseNames = new Set<string>();
    let multiIndex = 0;
    for (const v of variants) {
        if (v.values.length > 1) multiIndex++;
        const presenceKey = groupPresence.get(v) ?? null;
        const caseName = disc
            ? caseNameForVariant(
                disc.key, v.values, presenceKey, v.values.length > 1 ? multiIndex - 1 : 0, usedCaseNames)
            : enumCaseName(presenceKey!, usedCaseNames);
        const payload = swiftType(v.ir, `${hint}${pascalFromToken(caseName.replace(/`/g, ''))}`);
        cases.push({ variant: v, caseName, payload, presenceKey });
    }

    const L: string[] = [];
    L.push(`enum ${name}: Codable, Sendable, Equatable {`);
    for (const c of cases) L.push(`    case ${c.caseName}(${c.payload})`);
    L.push('');

    const emitPresenceChain = (group: VariantInfo[], indent: string) => {
        L.push(`${indent}let probe = try decoder.container(keyedBy: AnyCodingKey.self)`);
        group.forEach((v, i) => {
            const c = cases.find((x) => x.variant === v)!;
            if (i < group.length - 1) {
                L.push(`${indent}${i === 0 ? 'if' : '} else if'} probe.contains(AnyCodingKey("${c.presenceKey}")) {`);
                L.push(`${indent}    self = .${c.caseName}(try ${c.payload}(from: decoder))`);
            } else {
                L.push(`${indent}} else {`);
                L.push(`${indent}    self = .${c.caseName}(try ${c.payload}(from: decoder))`);
                L.push(`${indent}}`);
            }
        });
    };

    const discIsBool = !!disc && typeof variants[0].values[0] === 'boolean';
    // A `switch` over a Bool has no `default:` clause here, so it is exhaustive
    // only if both `true` and `false` are actually covered. When every variant
    // shares one boolean value the tag discriminates nothing — drop the switch
    // and let key presence do the work (it must, or the union is undecodable).
    const boolCovered = new Set<string>();
    if (discIsBool) for (const v of variants) for (const lit of v.values) boolCovered.add(String(lit));
    const boolSwitchExhaustive = boolCovered.has('true') && boolCovered.has('false');
    if (discIsBool && !boolSwitchExhaustive) {
        if (groups.size > 1 || variants.some((v) => !groupPresence.get(v))) {
            fail(
                `union '${name}' has a boolean discriminant '${disc!.key}' that never takes both ` +
                `values, and key presence cannot separate the variants either. ` +
                `Give the variants a string literal tag in the server contract.`,
            );
        }
    }
    const useDiscriminantSwitch = !!disc && (!discIsBool || boolSwitchExhaustive);

    if (useDiscriminantSwitch) {
        L.push(`    private enum DiscriminantKey: String, CodingKey {`);
        L.push(`        case discriminant = "${disc!.key}"`);
        L.push(`    }`);
        L.push('');
        L.push(`    init(from decoder: any Decoder) throws {`);
        L.push(`        let tag = try decoder.container(keyedBy: DiscriminantKey.self)`);
        L.push(`        let discriminant = try tag.decode(${discIsBool ? 'Bool' : 'String'}.self, forKey: .discriminant)`);
        L.push(`        switch discriminant {`);
        for (const [, group] of groups) {
            const labels = group[0].values.map((v) => (discIsBool ? String(v) : `"${v}"`)).join(', ');
            L.push(`        case ${labels}:`);
            if (group.length === 1) {
                const c = cases.find((x) => x.variant === group[0])!;
                L.push(`            self = .${c.caseName}(try ${c.payload}(from: decoder))`);
            } else {
                emitPresenceChain(group, '            ');
            }
        }
        if (!discIsBool) {
            L.push(`        default:`);
            L.push(`            throw DecodingError.dataCorrupted(.init(`);
            L.push(`                codingPath: decoder.codingPath,`);
            L.push(`                debugDescription: "unknown ${disc!.key}: \\(discriminant)"))`);
        }
        L.push(`        }`);
        L.push(`    }`);
    } else {
        L.push(`    init(from decoder: any Decoder) throws {`);
        emitPresenceChain(variants, '        ');
        L.push(`    }`);
    }

    L.push('');
    L.push(`    func encode(to encoder: any Encoder) throws {`);
    L.push(`        switch self {`);
    for (const c of cases) L.push(`        case .${c.caseName}(let v): try v.encode(to: encoder)`);
    L.push(`        }`);
    L.push(`    }`);
    L.push(`}`);
    return L.join('\n');
}

// ── the type mapper ────────────────────────────────────────────────────────

function swiftType(ir: TypeIR, hint: string, field: string | null = null): string {
    switch (ir.kind) {
        case 'primitive':
            // TS `number` carries no int/float distinction; Double round-trips
            // every JSON number the server can emit.
            return ir.name === 'string' ? 'String' : ir.name === 'number' ? 'Double' : 'Bool';
        case 'unknown': return 'JSONValue';
        case 'void': return 'EmptyInput';
        case 'stringLiteral': return 'String';
        case 'numberLiteral': return 'Double';
        case 'booleanLiteral': return 'Bool';
        case 'null': fail(`bare null has no Swift type (hint: ${hint})`);
        case 'undefined': fail(`bare undefined has no Swift type (hint: ${hint})`);
        case 'array': return `[${swiftType(ir.element, `${hint}Item`, field)}]`;
        case 'record':
            return `[${swiftType(ir.key, `${hint}Key`)}: ${swiftType(ir.value, `${hint}Value`, field)}]`;
        case 'named': {
            const existing = namedModels.get(ir.name);
            if (existing) return existing;
            fail(`named type '${ir.name}' referenced before declaration`);
        }
        case 'object': {
            const key = irKey(ir);
            const hit = declByKey.get(key);
            if (hit) return hit;
            const name = mintName(hint);
            declByKey.set(key, name);
            push(name, emitStruct(name, ir.props, name));
            return name;
        }
        case 'union': {
            const key = irKey(ir);
            recordUnionSite(key, hint, field);
            const hit = declByKey.get(key);
            if (hit) return hit;
            const { base, hasNull } = splitNullability(ir);
            if (hasNull) {
                // A nullable union in a non-property position (array element,
                // map value): Optional wraps whatever the rest resolves to.
                return `${swiftType(base, hint, field)}?`;
            }
            // A union of numeric literals (`9 | 18`) is just a number: Swift
            // has no Double-backed RawRepresentable worth minting for it.
            if (ir.members.every((m) => m.kind === 'numberLiteral')) return 'Double';
            if (ir.members.every((m) => m.kind === 'booleanLiteral')) return 'Bool';
            const lits = literalValuesOf(ir);
            if (lits && lits.every((v) => typeof v === 'string')) {
                stringEnumValues.set(key, lits as string[]);
                const name = stableEnumNames.get(key) ?? mintName(hint);
                declByKey.set(key, name);
                push(name, emitStringEnum(name, lits as string[]));
                return name;
            }
            const name = mintName(hint);
            declByKey.set(key, name);
            // Reserve the name before recursing — payload structs hang off it.
            const shapes = ir.members.map(jsonShape);
            const allObjects = shapes.every((s) => s === 'object');
            if (allObjects) {
                push(name, emitUnionEnum(name, ir.members, name));
                return name;
            }
            // String literals share one shape slot; every other shape must be
            // unique on the WIRE, otherwise two members are indistinguishable.
            // A map and an object are both JSON objects, and `unknown` matches
            // everything — both collapse the slot rather than widening it.
            if (ir.members.some((m) => m.kind === 'unknown')) {
                fail(
                    `union '${name}' contains \`unknown\`, which matches every other variant. ` +
                    `Narrow the server contract.`,
                );
            }
            const wireShape = (ir2: TypeIR) => (jsonShape(ir2) === 'map' ? 'object' : jsonShape(ir2));
            const nonLiteralShapes = ir.members
                .filter((m) => m.kind !== 'stringLiteral')
                .map(wireShape);
            const hasStringLiteral = ir.members.some((m) => m.kind === 'stringLiteral');
            const distinct = new Set(nonLiteralShapes).size === nonLiteralShapes.length
                && !(hasStringLiteral && nonLiteralShapes.includes('string'));
            if (!distinct) {
                fail(
                    `union '${name}' mixes shapes that cannot be told apart on the wire ` +
                    `(${shapes.join(' | ')}). Give the variants a literal tag.`,
                );
            }
            push(name, emitShapeUnion(name, ir.members, name));
            return name;
        }
    }
}

const namedModelKeys = new Map<string, string>();
const namedModelHome = new Map<string, string>();

/**
 * Pass 1: mint the Swift name for a server interface. Names for EVERY named
 * type must exist before any body is emitted, because the interfaces reference
 * each other freely (and cyclically) — Swift has one module, so a type declared
 * while processing `admin` is the same type `friendly-rounds` refers to.
 */
function reserveNamedModel(tsName: string, ir: TypeIR): void {
    if (ir.kind !== 'object') fail(`named type '${tsName}' is not an object`);
    const key = irKey(ir);
    if (namedModels.has(tsName)) {
        const prev = namedModelKeys.get(tsName);
        if (prev && prev !== key) {
            fail(
                `named type '${tsName}' has two different shapes across API modules — ` +
                `Swift has one module, so one of them must be renamed server-side.\n` +
                `  ${prev}\n  ${key}`,
            );
        }
        return;
    }
    namedModels.set(tsName, mintName(tsName));
    namedModelKeys.set(tsName, key);
    namedModelHome.set(tsName, currentModule);
}

/** Pass 2: emit the body, in the module that first reserved the name. */
function emitNamedModel(tsName: string, ir: TypeIR): void {
    if (ir.kind !== 'object') fail(`named type '${tsName}' is not an object`);
    const name = namedModels.get(tsName)!;
    push(name, emitStruct(name, ir.props, name));
}

function swiftEndpointFile(mod: ModuleIR): string {
    const lines: string[] = [];
    lines.push(`// GENERATED — DO NOT EDIT. bun run generate:swift`);
    lines.push('');
    lines.push(`enum ${mod.pascal}Endpoints {`);
    const rows: string[] = [];
    for (const ep of mod.endpoints) {
        const inputType = ep.hasInput
            ? swiftType(ep.input!, `${mod.pascal}${pascalFromToken(ep.key)}Input`)
            : 'EmptyInput';
        const outputType = swiftType(ep.output, `${mod.pascal}${pascalFromToken(ep.key)}Output`);
        const pathParams = [...ep.path.matchAll(/:(\w+)/g)].map((m) => `"${m[1]}"`);
        rows.push(
            `    static let ${escapeIdent(ep.key)} = APIEndpoint<${inputType}, ${outputType}>(\n` +
            `        method: .${ep.method.toLowerCase()},\n` +
            `        path: "${ep.path}",\n` +
            `        pathParams: [${pathParams.join(', ')}])`,
        );
    }
    lines.push(rows.join('\n'));
    lines.push(`}`);
    lines.push('');
    return lines.join('\n');
}

const SUPPORT_SWIFT = `// GENERATED — DO NOT EDIT. bun run generate:swift
//
// Hand-written transport lives OUTSIDE this directory; these are the shared
// runtime pieces the generated code needs and nothing more.

import Foundation

enum HTTPMethod: String, Sendable, Equatable {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

/// One endpoint of a generated API: method, path template and the names of the
/// \`:param\` segments in it. Carries no transport — the actor client does.
struct APIEndpoint<Input: Encodable & Sendable, Output: Decodable & Sendable>: Sendable {
    let method: HTTPMethod
    let path: String
    let pathParams: [String]

    init(method: HTTPMethod, path: String, pathParams: [String]) {
        self.method = method
        self.path = path
        self.pathParams = pathParams
    }
}

/// Placeholder input for endpoints that take none.
struct EmptyInput: Codable, Sendable, Equatable {
    init() {}
}

/// Absent / null / value — the three states a TS \`?: null | T\` property has on
/// the wire. Collapsing any two of them loses information the server acts on.
enum TriState<Wrapped: Codable & Sendable & Equatable>: Sendable, Equatable {
    case absent
    case null
    case value(Wrapped)

    var value: Wrapped? {
        if case .value(let v) = self { return v }
        return nil
    }

    var isAbsent: Bool {
        if case .absent = self { return true }
        return false
    }
}

/// Any JSON value — the Swift image of TS \`unknown\`.
enum JSONValue: Codable, Sendable, Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: any Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let v = try? c.decode(Bool.self) { self = .bool(v); return }
        if let v = try? c.decode(Double.self) { self = .number(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        if let v = try? c.decode([JSONValue].self) { self = .array(v); return }
        if let v = try? c.decode([String: JSONValue].self) { self = .object(v); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "unrepresentable JSON value")
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .string(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        }
    }
}

/// Coding key for key-presence probing (the fallback discriminator).
struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init(_ stringValue: String) {
        self.stringValue = stringValue
        self.intValue = nil
    }

    init?(stringValue: String) { self.init(stringValue) }

    init?(intValue: Int) {
        self.stringValue = String(intValue)
        self.intValue = intValue
    }
}
`;

// ═══ Main ══════════════════════════════════════════════════════════════════

// NO .sort() — deliberately the framework's raw `readdirSync` order. TypeScript
// orders union members by type id (creation order) and caches resolved TypeBox
// `Static<>` shapes, so the order in which modules are analysed leaks into the
// emitted property/union order. Sorting here breaks byte identity with the
// committed `src/api/*.gen.ts`. Swift emission re-sorts by name below, so the
// Swift output does not inherit this filesystem dependency for naming.
const apiFiles = readdirSync(apiDir).filter((f) => f.endsWith('.api.ts'));
const modules: ModuleIR[] = [];

for (const file of apiFiles) {
    const name = file.replace('.api.ts', '');
    const factoryName = `create${toPascal(name)}Api`;
    const mod = await import(join(apiDir, file));
    if (typeof mod[factoryName] !== 'function') {
        fail(`${file} must export a function named ${factoryName}`);
    }
    modules.push(analyzeModule(name, mod[factoryName]));
}

// ── proof: emitTS reproduces the framework output byte-for-byte ────────────

let verifyFailures = 0;
if (!SKIP_VERIFY) {
    let matched = 0;
    const missing: string[] = [];
    const waived: string[] = [];
    let expectedCount = 0;
    for (const mod of modules) {
        const expectedPath = join(refDir ?? tsOutDir, `${mod.name}.gen.ts`);
        if (!existsSync(expectedPath)) {
            if (ALLOW_MISSING.has(mod.name)) waived.push(mod.name);
            else missing.push(mod.name);
            continue;
        }
        expectedCount++;
        const expected = readFileSync(expectedPath, 'utf8');
        const actual = emitTS(mod);
        if (expected === actual) {
            matched++;
            continue;
        }
        verifyFailures++;
        console.error(`\nVERIFY FAIL ${mod.name}.gen.ts`);
        const e = expected.split('\n');
        const a = actual.split('\n');
        for (let i = 0; i < Math.max(e.length, a.length); i++) {
            if (e[i] !== a[i]) {
                console.error(`  line ${i + 1}`);
                console.error(`  expected: ${JSON.stringify(e[i]?.slice(0, 400))}`);
                console.error(`  actual:   ${JSON.stringify(a[i]?.slice(0, 400))}`);
                break;
            }
        }
    }
    console.log(`verify: ${matched}/${expectedCount} clients byte-identical to src/api/*.gen.ts`);
    if (waived.length) {
        console.log(`verify: oracle waived via --allow-missing for ${waived.join(', ')}`);
    }
    if (missing.length) {
        const dir = (refDir ?? tsOutDir).replace(rootDir + '/', '');
        console.error(
            `\nverify: MISSING ORACLE — no ${dir}/<name>.gen.ts for ${missing.join(', ')}.\n` +
            `  The byte-identity proof cannot run for those modules, so it proves nothing about them.\n` +
            `  Fix: run \`bun run generate\` to emit the framework clients, then re-run.\n` +
            `  To waive deliberately: --allow-missing ${missing.join(' --allow-missing ')}`,
        );
        process.exit(1);
    }
    if (verifyFailures > 0) {
        console.error(`\nverify: ${verifyFailures} client(s) differ — the IR is lossy. Not writing Swift.`);
        process.exit(1);
    }
}

if (VERIFY_ONLY) process.exit(0);

// ── Swift ─────────────────────────────────────────────────────────────────

// Swift emission runs in NAME order so type naming never depends on the
// filesystem's readdir order (see the `apiFiles` note above).
const swiftModules = [...modules].sort((a, b) => (a.name < b.name ? -1 : 1));

for (const mod of swiftModules) {
    for (const iface of mod.interfaces) namedIR.set(iface.name, iface.type);
}

const endpointFiles = new Map<string, string>();

function emitSwiftPass(): void {
    for (const mod of swiftModules) {
        currentModule = mod.pascal;
        for (const iface of mod.interfaces) reserveNamedModel(iface.name, iface.type);
    }
    // Reserve the resolved enum names alongside the models, so an anonymous
    // struct minted mid-emission is the one that gets bumped, never an enum.
    for (const name of stableEnumNames.values()) takenNames.add(name);
    for (const mod of swiftModules) {
        for (const iface of mod.interfaces) {
            if (namedModelHome.get(iface.name) !== mod.pascal) continue;
            currentModule = mod.pascal;
            emitNamedModel(iface.name, iface.type);
        }
    }
    for (const mod of swiftModules) {
        currentModule = mod.pascal;
        endpointFiles.set(`${mod.pascal}Endpoints.swift`, swiftEndpointFile(mod));
    }
}

function resetSwiftPass(): void {
    swiftDecls.length = 0;
    declByKey.clear();
    takenNames.clear();
    for (const n of RESERVED_TYPE_NAMES) takenNames.add(n);
    namedModels.clear();
    namedModelKeys.clear();
    namedModelHome.clear();
    endpointFiles.clear();
}

// Pass 1 is thrown away. Its only product is `unionSites` / `stringEnumKeys`:
// which structural keys are string enums and which property names carry them,
// across every module. Names cannot be resolved during a walk, because the
// first site to be visited would decide — the very coupling being removed.
emitSwiftPass();
resolveStableEnumNames([...namedModels.values()]);
resetSwiftPass();
emitSwiftPass();

rmSync(swiftOutDir, { recursive: true, force: true });
mkdirSync(swiftOutDir, { recursive: true });
writeFileSync(join(swiftOutDir, 'APISupport.swift'), SUPPORT_SWIFT);

const byModule = new Map<string, SwiftDecl[]>();
for (const decl of swiftDecls) {
    if (!byModule.has(decl.module)) byModule.set(decl.module, []);
    byModule.get(decl.module)!.push(decl);
}
for (const [module, decls] of byModule) {
    const body = decls.map((d) => d.text).join('\n\n');
    writeFileSync(
        join(swiftOutDir, `${module}Types.swift`),
        `// GENERATED — DO NOT EDIT. bun run generate:swift\n\nimport Foundation\n\n${body}\n`,
    );
}
for (const [file, text] of endpointFiles) writeFileSync(join(swiftOutDir, file), text);

console.log(
    `swift: ${swiftDecls.length} types + ${modules.length} endpoint listings → ` +
    `${swiftOutDir.replace(rootDir + '/', '')}`,
);
