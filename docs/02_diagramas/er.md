erDiagram
    usuarios {
        int id PK
        varchar username UK
        varchar email UK
        varchar password
        boolean activo
        timestamp created_at
        int created_by
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
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    usuarios_roles {
        int usuario_id PK, FK
        int rol_id PK, FK
    }

    permisos {
        int id PK
        varchar nombre UK
        varchar descripcion
        int opcion_menu_id FK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    roles_permisos {
        int rol_id PK, FK
        int permiso_id PK, FK
    }

    opciones_menu {
        int id PK
        varchar nombre
        varchar icono
        varchar ruta_angular
        int padre_id FK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    provincias {
        int id PK
        varchar nombre UK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    cantones {
        int id PK
        varchar nombre
        int provincia_id FK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    parroquias {
        int id PK
        varchar nombre
        int canton_id FK
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    direcciones {
        int id PK
        varchar calle_principal
        varchar calle_secundaria
        text referencia
        decimal latitud
        decimal longitud
        int parroquia_id FK
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

    tipo_incidencia {
        int id PK
        varchar nombre
        timestamp created_at
        int created_by
        timestamp updated_at
        int updated_by
        timestamp deleted_at
        int deleted_by
    }

    sub_tipo_incidencia {
        int id PK
        int tipo_incidencia_id FK
        varchar nombre
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
        int prioridad_id FK
        int tipo_incidencia_id FK
        int sub_tipo_incidencia_id FK
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
    usuarios ||--o{ usuarios_roles : "tiene"
    roles ||--o{ usuarios_roles : "se asigna a"
    roles |o--o| roles : "hereda de (padre_id)"
    
    roles ||--o{ roles_permisos : "contiene"
    permisos ||--o{ roles_permisos : "pertenece a"
    
    opciones_menu ||--o{ permisos : "aloja"
    opciones_menu |o--o| opciones_menu : "tiene submenus (padre_id)"

    %% Relaciones Geográficas y Direcciones
    provincias ||--o{ cantones : "se divide en"
    cantones ||--o{ parroquias : "se divide en"
    parroquias ||--o{ direcciones : "pertenece a"

    %% Relaciones de Clasificación de Incidencias
    tipo_incidencia ||--o{ sub_tipo_incidencia : "se divide en"
    tipo_incidencia ||--o{ reporte_incidencias : "agrupa"
    sub_tipo_incidencia ||--o{ reporte_incidencias : "subclasifica"

    %% Relaciones del Reporte de Incidencias
    direcciones ||--o{ reporte_incidencias : "ocurre en"
    usuarios ||--o{ reporte_incidencias : "reportado por (cliente_id)"
    estados_incidencia ||--o{ reporte_incidencias : "estado actual"
    instituciones ||--o{ reporte_incidencias : "atendido por"
    prioridades ||--o{ reporte_incidencias : "nivel de urgencia"

    %% Trazabilidad e Historial
    reporte_incidencias ||--o{ historial_incidencias : "registra historial"
    estados_incidencia ||--o{ historial_incidencias : "estado transicionado"
    usuarios ||--o{ historial_incidencias : "cambiado por"

    %% Relación de Auditoría Global (JSONB)
    usuarios ||--o{ auditorias : "realiza cambio"