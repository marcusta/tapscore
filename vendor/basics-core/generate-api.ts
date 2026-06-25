import ts from 'typescript';
import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// ─── Paths ──────────────────────────────────────────────────────────────────

const rootDir = process.cwd();
const apiDir = join(rootDir, process.env.BASICS_API_IN_DIR ?? 'server/api');
const outDir = join(rootDir, process.env.BASICS_API_OUT_DIR ?? 'src/api');

// Convert a descriptor filename stem ("guest-players", "guest_players",
// "guestPlayers", "players") to its PascalCase factory name component.
function toPascal(stem: string): string {
    return stem
        .split(/[-_]/)
        .filter(Boolean)
        .map((seg) => seg[0].toUpperCase() + seg.slice(1))
        .join('');
}

// ─── Runtime descriptor loading (for method, path, hasSchema) ───────────────

interface RuntimeEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    fn: (...args: any[]) => any;
    schema?: unknown;
}

const dummyService = new Proxy({}, { get: () => () => {} });

// ─── TypeScript program (for fn input/output types) ─────────────────────────

const configPath = join(rootDir, 'tsconfig.server.json');
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, rootDir);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

// ─── Type utilities ─────────────────────────────────────────────────────────

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

/**
 * Returns the name if this type is a named **interface-shaped** server type.
 * Aliases to unions / intersections / primitives / literals fall through to
 * inline serialisation — otherwise `expandInterface` would walk the prototype
 * chain of the underlying primitive (e.g. String for `type X = 'a' | 'b'`)
 * and emit ~70 lines of garbage methods.
 */
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

/** True iff `type` can be safely expanded as `export interface Name { ... }`. */
function isInterfaceLike(type: ts.Type): boolean {
    if (type.isUnion() || type.isIntersection()) return false;
    if (!(type.flags & ts.TypeFlags.Object)) return false;
    const symbol = type.getSymbol();
    if (symbol?.name === 'Array' || symbol?.name === 'Promise') return false;
    if (type.getCallSignatures().length > 0) return false;
    return true;
}

/** Get the type of a symbol using its declaration as context. */
function typeOfSymbol(symbol: ts.Symbol): ts.Type {
    const location = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!location) throw new Error(`No declaration for symbol: ${symbol.name}`);
    return checker.getTypeOfSymbolAtLocation(symbol, location);
}

// ─── Type serialization ─────────────────────────────────────────────────────

/**
 * Serialize a type to a string for the generated file.
 * Named server types are collected into `named` and referenced by name.
 * Intersections are prettified — flattened into a single object literal.
 */
function serializeType(type: ts.Type, named: Map<string, ts.Type>): string {
    // Void / undefined / null
    if (type.flags & ts.TypeFlags.Void) return 'void';
    if (type.flags & ts.TypeFlags.Undefined) return 'undefined';
    if (type.flags & ts.TypeFlags.Null) return 'null';

    // Named server type → collect and reference by name
    const name = serverTypeName(type);
    if (name) {
        if (!named.has(name)) named.set(name, type);
        return name;
    }

    // Tuple → recurse on element types
    if (checker.isTupleType(type)) {
        const elements = checker.getTypeArguments(type as ts.TypeReference);
        return `[${elements.map(t => serializeType(t, named)).join(', ')}]`;
    }

    // Array → recurse on element type
    const el = getArrayElementType(type);
    if (el) {
        const inner = serializeType(el, named);
        return inner.includes('|') || inner.includes('&') ? `(${inner})[]` : `${inner}[]`;
    }

    // Boolean keyword
    if (type.flags & ts.TypeFlags.Boolean) return 'boolean';

    // Boolean literal (true / false)
    if (type.flags & ts.TypeFlags.BooleanLiteral) return checker.typeToString(type);

    // Union
    if (type.isUnion()) {
        const boolCount = type.types.filter(t => t.flags & ts.TypeFlags.BooleanLiteral).length;
        // Pure boolean (true | false)
        if (boolCount === type.types.length) return 'boolean';
        // Mixed: collapse true|false → boolean, keep the rest
        if (boolCount === 2) {
            const rest = type.types
                .filter(t => !(t.flags & ts.TypeFlags.BooleanLiteral))
                .map(t => serializeType(t, named));
            return ['boolean', ...rest].join(' | ');
        }
        return type.types.map(t => serializeType(t, named)).join(' | ');
    }

    // Intersection → prettify: merge all properties into a flat object
    if (type.isIntersection()) {
        return serializeObjectInline(type.getProperties(), named);
    }

    // Anonymous object → inline
    if (type.flags & ts.TypeFlags.Object) {
        const props = type.getProperties();
        if (props.length > 0 && !type.getCallSignatures().length) {
            return serializeObjectInline(props, named);
        }
    }

    // Primitives, string/number literals — fallback to typeToString
    const text = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    return text.replace(/"/g, "'");
}

/** Serialize an object type's properties inline: `{ id: string; name: string }` */
function serializeObjectInline(props: ts.Symbol[], named: Map<string, ts.Type>): string {
    if (props.length === 0) return '{}';
    const parts = props.map(prop => {
        const optional = (prop.flags & ts.SymbolFlags.Optional) ? '?' : '';
        let typeStr = serializeType(typeOfSymbol(prop), named);
        if (optional) typeStr = typeStr.replace(/ \| undefined$/, '').replace(/^undefined \| /, '');
        return `${prop.name}${optional}: ${typeStr}`;
    });
    return `{ ${parts.join('; ')} }`;
}

/** Expand a named type into a full `export interface Name { ... }` declaration. */
function expandInterface(name: string, type: ts.Type, named: Map<string, ts.Type>): string {
    if (!isInterfaceLike(type)) {
        const decl = (type.aliasSymbol || type.getSymbol())?.declarations?.[0];
        const file = decl?.getSourceFile().fileName ?? '<unknown>';
        throw new Error(
            `generate-api: cannot expand '${name}' (declared in ${file}) ` +
            `as an interface — it is a union/intersection/primitive alias. ` +
            `Inline the literal at use sites, or move the alias outside /server/.`,
        );
    }
    const props = type.getProperties();
    const lines = props.map(prop => {
        const optional = (prop.flags & ts.SymbolFlags.Optional) ? '?' : '';
        let typeStr = serializeType(typeOfSymbol(prop), named);
        if (optional) typeStr = typeStr.replace(/ \| undefined$/, '').replace(/^undefined \| /, '');
        return `    ${prop.name}${optional}: ${typeStr};`;
    });
    return `export interface ${name} {\n${lines.join('\n')}\n}`;
}

// ─── Descriptor analysis ────────────────────────────────────────────────────

interface EndpointInfo {
    key: string;
    method: string;
    path: string;
    hasInput: boolean;
    inputType: string;
    outputType: string;
}

function resolveEndpointTypes(
    sourceFile: ts.SourceFile,
    factoryName: string,
    runtimeApi: Record<string, RuntimeEndpoint>,
    named: Map<string, ts.Type>,
): EndpointInfo[] {
    // Find factory function in AST
    const factoryNode = sourceFile.statements.find(
        (s): s is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(s) && s.name?.text === factoryName,
    );
    if (!factoryNode) throw new Error(`${factoryName} not found in ${sourceFile.fileName}`);

    // Get the return type of the factory (the descriptor object)
    const fnSymbol = checker.getSymbolAtLocation(factoryNode.name!)!;
    const fnType = checker.getTypeOfSymbolAtLocation(fnSymbol, factoryNode);
    const returnType = checker.getReturnTypeOfSignature(fnType.getCallSignatures()[0]);

    const endpoints: EndpointInfo[] = [];

    for (const [key, runtime] of Object.entries(runtimeApi)) {
        if (!runtime.method || !runtime.path || typeof runtime.fn !== 'function') {
            throw new Error(`${factoryName}.${key}: invalid endpoint — must have method, path, fn`);
        }

        const hasPathParams = runtime.path.includes(':');
        const hasInput = 'schema' in runtime || hasPathParams;

        // Resolve fn types from the type checker
        const epProp = returnType.getProperty(key);
        if (!epProp) throw new Error(`${factoryName}.${key}: not found in return type`);

        const epType = checker.getTypeOfSymbolAtLocation(epProp, factoryNode);
        const fnPropSymbol = epType.getProperty('fn')!;
        const fnPropType = checker.getTypeOfSymbolAtLocation(fnPropSymbol, factoryNode);
        const sig = fnPropType.getCallSignatures()[0];

        // Input type
        let inputType = '';
        const params = sig.getParameters();
        if (hasInput && params.length > 0) {
            inputType = serializeType(typeOfSymbol(params[0]), named);
        }

        // Output type (unwrap Promise, handle void)
        const awaited = unwrapPromise(checker.getReturnTypeOfSignature(sig));
        const outputType = (awaited.flags & ts.TypeFlags.Void)
            ? '{ ok: boolean }'
            : serializeType(awaited, named);

        endpoints.push({
            key,
            method: runtime.method,
            path: runtime.path,
            hasInput: hasInput && params.length > 0,
            inputType,
            outputType,
        });
    }

    return endpoints;
}

// ─── Code generation ────────────────────────────────────────────────────────

function generateSource(Pascal: string, endpoints: EndpointInfo[], interfaces: string[]): string {
    const interfaceLines: string[] = [];
    const implLines: string[] = [];

    for (const ep of endpoints) {
        // Interface line
        const inputParam = ep.hasInput ? `input: ${ep.inputType}` : '';
        interfaceLines.push(`    ${ep.key}(${inputParam}): Promise<${ep.outputType}>;`);

        // Implementation
        if (ep.method === 'GET') {
            const pathParamNames = [...ep.path.matchAll(/:(\w+)/g)].map((m) => m[1]);
            if (pathParamNames.length > 0) {
                // Path-param GET: substitute into URL, send remaining input fields as query.
                const pathExpr = ep.path.replace(/:(\w+)/g, (_, name) => `\${input.${name}}`);
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
            const pathParamNames = [...ep.path.matchAll(/:(\w+)/g)].map((m) => m[1]);
            if (pathParamNames.length > 0) {
                const pathExpr = ep.path.replace(/:(\w+)/g, (_, name) => `\${input.${name}}`);
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
            const pathExpr = ep.path.replace(/:(\w+)/g, (_, name) => `\${input.${name}}`);
            implLines.push(`        async ${ep.key}(input) {`);
            implLines.push(`            return apiFetch({ method: 'DELETE', url: \`\${baseUrl}${pathExpr}\` });`);
            implLines.push(`        },`);
        }
    }

    const typesBlock = interfaces.length > 0 ? '\n' + interfaces.join('\n\n') + '\n' : '';

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

// ─── Main ───────────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });

// Auto-discover *.api.ts files
const apiFiles = readdirSync(apiDir).filter(f => f.endsWith('.api.ts'));
const modules: { name: string; factory: (svc: any) => Record<string, RuntimeEndpoint> }[] = [];

for (const file of apiFiles) {
    const name = file.replace('.api.ts', '');
    const Pascal = toPascal(name);
    const factoryName = `create${Pascal}Api`;
    const mod = await import(join(apiDir, file));
    if (typeof mod[factoryName] !== 'function') {
        throw new Error(`${file} must export a function named ${factoryName}`);
    }
    modules.push({ name, factory: mod[factoryName] });
}

for (const mod of modules) {
    const Pascal = toPascal(mod.name);
    const factoryName = `create${Pascal}Api`;

    // Runtime: get method, path, hasSchema
    const runtimeApi = mod.factory(dummyService as any) as Record<string, RuntimeEndpoint>;

    // Type checker: get fn input/output types
    const sourceFile = program.getSourceFile(join(apiDir, `${mod.name}.api.ts`));
    if (!sourceFile) throw new Error(`Source file not found: ${mod.name}.api.ts`);

    const named = new Map<string, ts.Type>();
    const endpoints = resolveEndpointTypes(sourceFile, factoryName, runtimeApi, named);

    // Expand named types (iteratively — expanding one may discover more)
    const interfaces: string[] = [];
    const expanded = new Set<string>();
    let changed = true;
    while (changed) {
        changed = false;
        for (const [typeName, type] of named) {
            if (expanded.has(typeName)) continue;
            expanded.add(typeName);
            changed = true;
            interfaces.push(expandInterface(typeName, type, named));
        }
    }

    const source = generateSource(Pascal, endpoints, interfaces);

    const outPath = join(outDir, `${mod.name}.gen.ts`);
    writeFileSync(outPath, source);
    console.log(`Generated ${outPath}`);
}
