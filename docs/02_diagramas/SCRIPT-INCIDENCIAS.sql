CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);
CREATE TABLE public.categorias_incidencia (
    id bigint NOT NULL,
    parent_id bigint,
    prioridad_id bigint,
    nombre character varying(255) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    institucion_id bigint
);
CREATE TABLE public.direcciones (
    id bigint NOT NULL,
    territorio_id bigint NOT NULL,
    detalle text NOT NULL,
    referencia text,
    codigo_postal character varying(255),
    latitud numeric(10,8),
    longitud numeric(11,8),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    precision_gps numeric(10,2)
);
CREATE TABLE public.estados_incidencia (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint
);
CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.historial_incidencias (
    id bigint NOT NULL,
    incidencia_id bigint NOT NULL,
    estado_id bigint NOT NULL,
    usuario_id bigint,
    comentario text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.instituciones (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    siglas character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint,
    activo boolean DEFAULT true NOT NULL
);
CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);
CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);
CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);
CREATE TABLE public.opciones_menu (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    icono character varying(50),
    ruta character varying(255) NOT NULL,
    padre_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint NOT NULL,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint
);
CREATE TABLE public.paises (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    codigo_iso character varying(3),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);
CREATE TABLE public.performance_logs (
    id bigint NOT NULL,
    trp integer NOT NULL,
    endpoint character varying(255) NOT NULL,
    metodo character varying(10) NOT NULL,
    logged_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);
CREATE TABLE public.permisos (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    accion character varying(20) NOT NULL,
    recurso character varying(100) NOT NULL,
    opcion_menu_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_by bigint
);
CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.prioridades (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    color_hex character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint
);
CREATE TABLE public.recurso_incidencias (
    id bigint NOT NULL,
    incidencia_id bigint NOT NULL,
    url character varying(255) NOT NULL,
    tipo character varying(255) DEFAULT 'imagen'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.reporte_incidencias (
    id bigint NOT NULL,
    incidencia_descripcion text,
    direccion_id bigint,
    cliente_id bigint,
    estado_id bigint,
    institucion_id bigint,
    tipo_incidencia_id bigint,
    sub_tipo_incidencia_id bigint,
    prioridad_id bigint,
    cantidad_afectados_incidencia integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint
);
CREATE TABLE public.roles (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion character varying(255) NOT NULL,
    padre_id bigint,
    created_by bigint NOT NULL,
    deleted_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.roles_permisos (
    id bigint NOT NULL,
    rol_id bigint NOT NULL,
    permiso_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.roles_users (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    rol_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);
CREATE TABLE public.territorios (
    id bigint NOT NULL,
    pais_id bigint NOT NULL,
    parent_id bigint,
    nombre character varying(255) NOT NULL,
    tipo character varying(255),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    codigo character varying(255)
);
CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_by bigint,
    deleted_at timestamp(0) without time zone,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    pais_id bigint,
    institucion_id bigint
);
CREATE TABLE public.usuario_incidencia (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    reporte_incidencia_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    created_by bigint,
    updated_by bigint,
    deleted_at timestamp(0) without time zone,
    deleted_by bigint
);
CREATE TABLE public.usuario_territorios (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    territorio_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
