erDiagram
usuarios {
int id PK
varchar name
varchar username UK
varchar email UK
varchar password
boolean activo
int pais_id FK
timestamp created_at
int created_by FK
timestamp updated_at
int updated_by
timestamp deleted_at
int deleted_by
}

    roles {
        int id PK
        varchar nombre UK
        varchar descripcion
        int padre_id FK
        timestamp created_at
        int created_by FK
        timestamp updated_at
        int updated_by FK
        timestamp deleted_at
        int deleted_by FK
    }

    roles_users {
        int user_id PK, FK
        int rol_id PK, FK
    }

    permisos {
        int id PK
        varchar nombre UK
        varchar accion
        varchar recurso
        int opcion_menu_id FK
        timestamp created_at
        int created_by FK
        timestamp updated_at
        int updated_by FK
        timestamp deleted_at
        int deleted_by FK
    }

    roles_permisos {
        int rol_id PK, FK
        int permiso_id PK, FK
    }

    opciones_menu {
        int id PK
        varchar nombre
        varchar icono
        varchar ruta
        int padre_id FK
        timestamp created_at
        int created_by FK
        timestamp updated_at
        int updated_by FK
        timestamp deleted_at
        int deleted_by FK
    }

    paises {
        int id PK
        varchar nombre UK
        varchar codigo_iso UK
        boolean activo
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    %% Recursiva, provincia, cantón, parroquia
    territorios {
        int id PK
        int pais_id FK
        int parent_id FK
        varchar nombre
        varchar tipo
        boolean activo
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    direcciones {
        int id PK
        int territorio_id FK
        varchar detalle
        text referencia
        varchar codigo_postal
        decimal latitud
        decimal longitud
        boolean activo
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    prioridades {
        int id PK
        varchar nombre UK
        varchar color_hex
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    instituciones {
        int id PK
        varchar nombre UK
        varchar siglas UK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    estados_incidencia {
        int id PK
        varchar nombre UK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    %% Recursiva Clasificación de Incidencias (Categoria y subcategoria)
    categoria_incidencia {
        int parent_id PK
        int institucion_id FK
        int prioridad_id FK
        varchar nombre UK
        text descripcion
        boolean activo
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    reporte_incidencias {
        int id PK
        text incidencia_descripcion
        int direccion_id FK
        int cliente_id FK
        int estado_id FK
        int institucion_id FK
        int tipo_incidencia_id FK
        int sub_tipo_incidencia_id FK
        int cantidad_afectados_incidencia
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    user_reporte_incidencia {
        int id PK
        int user_id FK
        int incident_id FK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    historial_incidencias {
        int id PK
        int incidencia_id FK
        int estado_id FK
        int usuario_id FK
        text comentario
        timestamp created_at
    }

    auditorias {
        int id PK
        varchar tabla_nombre
        int registro_id
        varchar operacion
        jsonb valores_anteriores
        jsonb valores_nuevos
        int usuario_id FK
        timestamp fecha_cambio
    }

    %% Relaciones del Módulo de Seguridad y Accesos
    usuarios ||--o{ roles_users : "tiene"
    roles ||--o{ roles_users : "se asigna a"
    roles |o--o| roles : "hereda de (padre_id)"

    roles ||--o{ roles_permisos : "contiene"
    permisos ||--o{ roles_permisos : "pertenece a"

    opciones_menu ||--o{ permisos : "aloja"
    opciones_menu |o--o| opciones_menu : "tiene submenus (padre_id)"

    %% Relaciones Geográficas y Direcciones
    paises ||--o{ territorios : "contiene"
    territorios |o--o| territorios : "se subdivide en (parent_id)"
    territorios ||--o{ direcciones : "pertenece a"

    %% Relaciones de Clasificación de Incidencias
    prioridades ||--o{ categoria_incidencia : "se asigna a"
    categoria_incidencia |o--o| categoria_incidencia : "subclasifica (parent_id)"
    categoria_incidencia ||--o{ reporte_incidencia : "clasifica"

    %% Relaciones del Reporte de Incidencias
    direcciones ||--o{ reporte_incidencias : "ocurre en"
    usuarios ||--o{ reporte_incidencias : "reportado por (cliente_id)"
    estados_incidencia ||--o{ reporte_incidencias : "estado actual"
    instituciones ||--o{ reporte_incidencias : "atendido por"

    usuarios ||--o{ reporte_incidencias_users : "asignado a"
    reporte_incidencias ||--o{ reporte_incidencias_users : "usuarios involucrados"

    %% Trazabilidad e Historial
    reporte_incidencias ||--o{ historial_incidencias : "registra historial"
    estados_incidencia ||--o{ historial_incidencias : "estado transicionado"
    usuarios ||--o{ historial_incidencias : "cambiado por"

    %% Relación de Auditoría Global (JSONB)
    usuarios ||--o{ auditorias : "realiza cambio"
