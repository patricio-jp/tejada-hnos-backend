import { DataSource, DataSourceOptions } from 'typeorm';
import { ENV } from "@config/environment";
import { promises as dnsPromises } from 'dns';
import fs from 'fs';

// Construye las opciones de DataSource usando `POSTGRES_URL` si está definida;
// en caso contrario, usa las variables individuales (host/port/user/password/database).
const connectionUrl = (ENV as any).POSTGRES_URL as string | undefined;

/**
 * If the connection URL contains raw special characters in the username or password
 * (for example `%` or `#`), TypeORM/Node may call `decodeURIComponent` and throw
 * `URIError: URI malformed`. This helper percent-encodes the userinfo part
 * (username[:password]) if present so the resulting URL is safe to pass to TypeORM.
 */
function sanitizeConnectionUrl(raw: string): string {
    try {
        const m = raw.match(/^(postgres(?:ql)?:\/\/)([^@\/]+)@(.+)$/i);
        if (!m) return raw;
        const prefix = m[1];
        const userinfo = m[2] as string;
        const rest = m[3];
        const [user, ...passParts] = userinfo.split(':');
        const pass = passParts.length ? passParts.join(':') : undefined;
        const encUser = encodeURIComponent(user || '');
        const encPass = pass !== undefined ? encodeURIComponent(pass) : undefined;
        const encUserinfo = encPass !== undefined ? `${encUser}:${encPass}` : encUser;
        return `${prefix}${encUserinfo}@${rest}`;
    } catch (err) {
        return raw;
    }
}

// Construcción por defecto de opciones (sin inicializar)
const baseOptions: DataSourceOptions = {
    type: 'postgres',
    entities: ["src/entities/*.ts"],
    synchronize: true, // Set to false in production
    logging: true,
    extra: {
        timezone: 'UTC',
    },
};

function buildOptionsFromUrl(urlStr: string): DataSourceOptions {
    const parsed = new URL(sanitizeConnectionUrl(urlStr));
    // Detect SSL preferences from URL query params (e.g. ?sslmode=require or ?ssl=true)
    const sslFromUrl = (() => {
        try {
            const mode = parsed.searchParams.get('sslmode');
            const sslParam = parsed.searchParams.get('ssl');
            if (mode && (mode === 'require' || mode === 'true')) return { rejectUnauthorized: true };
            if (sslParam && (sslParam === 'true' || sslParam === '1')) return { rejectUnauthorized: true };
        } catch (e) {
            // ignore
        }
        return undefined;
    })();

    const opts: DataSourceOptions = {
        ...baseOptions,
        host: parsed.hostname,
        port: parsed.port ? +parsed.port : 5432,
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
        // attach ssl if present in URL or env variables
        ...(sslFromUrl ? { ssl: sslFromUrl } : {}),
    } as DataSourceOptions;

    // If env overrides are present, apply them (ENV takes precedence)
    const envSsl = resolveSslFromEnv();
    if (envSsl) (opts as any).ssl = envSsl;
    return opts;
}

function buildOptionsFromEnv(): DataSourceOptions {
    return {
        ...baseOptions,
        ...(ENV.POSTGRES_HOST ? { host: ENV.POSTGRES_HOST } : {}),
        ...(ENV.POSTGRES_PORT ? { port: +ENV.POSTGRES_PORT } : {}),
        username: ENV.POSTGRES_USERNAME,
        password: ENV.POSTGRES_PASSWORD,
        database: ENV.POSTGRES_DATABASE,
        ...(resolveSslFromEnv() ? { ssl: resolveSslFromEnv() } : {}),
    } as DataSourceOptions;
}

function resolveSslFromEnv(): any | undefined {
    // ENV vars: POSTGRES_SSL (true/false), POSTGRES_SSL_REJECT_UNAUTHORIZED (true/false), POSTGRES_SSL_CA (path or PEM)
    try {
        const sslEnv = (ENV as any).POSTGRES_SSL;
        if (!sslEnv) return undefined;
        const enabled = String(sslEnv).toLowerCase() === 'true' || String(sslEnv) === '1';
        if (!enabled) return undefined;
        const rej = (ENV as any).POSTGRES_SSL_REJECT_UNAUTHORIZED;
        const rejectUnauthorized = rej === undefined ? true : !(String(rej).toLowerCase() === 'false' || String(rej) === '0');
        let ca: string | undefined = undefined;
        const caEnv = (ENV as any).POSTGRES_SSL_CA;
        if (caEnv) {
            try {
                // If looks like a path, try read file; otherwise assume it's PEM content
                if (fs.existsSync(String(caEnv))) ca = fs.readFileSync(String(caEnv), 'utf8');
                else ca = String(caEnv);
            } catch (e) {
                // ignore
            }
        }
        const sslObj: any = { rejectUnauthorized };
        if (ca) sslObj.ca = ca;
        return sslObj;
    } catch (e) {
        return undefined;
    }
}

// debug DNS helper removed

/**
 * Crea e inicializa un DataSource, con reintentos en caso de `ENOTFOUND` intentando
 * resolver A/AAAA y reintentando la conexión usando la IP resuelta.
 */
export async function createAndInitializeDataSource(): Promise<DataSource> {
    const connectionUrlRaw = (ENV as any).POSTGRES_URL as string | undefined;
    let initialOptions: DataSourceOptions = connectionUrlRaw ? buildOptionsFromUrl(connectionUrlRaw) : buildOptionsFromEnv();

        // no debug DNS logs in production

    let ds = new DataSource(initialOptions);
    try {
        await ds.initialize();
        return ds;
    } catch (err: any) {
        console.error('Error connecting to the database:', err);
        // Si el error es ENOTFOUND, intentar resolver manualmente A/AAAA y reintentar
        if (err && err.code === 'ENOTFOUND' && connectionUrlRaw) {
            try {
                const parsed = new URL(sanitizeConnectionUrl(connectionUrlRaw));
                const hostname = parsed.hostname;
                // intenta IPv4 primero
                try {
                    const v4 = await dnsPromises.resolve4(hostname);
                    if (v4 && v4.length) {
                        const opts = { ...initialOptions, host: v4[0] } as DataSourceOptions;
                        ds = new DataSource(opts);
                        await ds.initialize();
                        return ds;
                    }
                } catch (e) {
                    // continue to IPv6
                }
                // IPv6
                try {
                    const v6 = await dnsPromises.resolve6(hostname);
                    if (v6 && v6.length) {
                        const opts = { ...initialOptions, host: v6[0] } as DataSourceOptions;
                        ds = new DataSource(opts);
                        await ds.initialize();
                        return ds;
                    }
                } catch (e) {
                    // no addresses
                }
            } catch (e) {
                console.warn('Resolución manual de A/AAAA falló:', e);
            }
        }
        throw err;
    }
}

// Mantener export opcional del objeto options por compatibilidad si se necesitara
export const PostgreSQLOptions = connectionUrl ? buildOptionsFromUrl(connectionUrl) : buildOptionsFromEnv();
