<?php

namespace App\Enums;

enum PermissionsEnum: string
{
    // Usuarios
    case READ_USUARIOS = 'Ver Usuario';
    case CREATE_USUARIOS = 'Crear Usuario';
    case UPDATE_USUARIOS = 'Actualizar Usuario';
    case DELETE_USUARIOS = 'Eliminar Usuario';

    // Roles
    case READ_ROLES = 'Ver Rol';
    case CREATE_ROLES = 'Crear Rol';
    case UPDATE_ROLES = 'Actualizar Rol';
    case DELETE_ROLES = 'Eliminar Rol';

    // Permisos
    case READ_PERMISOS = 'Ver Permiso';
    case CREATE_PERMISOS = 'Crear Permiso';
    case UPDATE_PERMISOS = 'Actualizar Permiso';
    case DELETE_PERMISOS = 'Eliminar Permiso';

    // Opciones de Menú
    case READ_OPCIONES_MENU = 'Ver Opción de Menú';
    case CREATE_OPCIONES_MENU = 'Crear Opción de Menú';
    case UPDATE_OPCIONES_MENU = 'Actualizar Opción de Menú';
    case DELETE_OPCIONES_MENU = 'Eliminar Opción de Menú';

    // SQA
    case READ_SQA = 'Ver SQA';
    case CREATE_SQA = 'Crear SQA';
    case UPDATE_SQA = 'Actualizar SQA';
    case DELETE_SQA = 'Eliminar SQA';

    // Ubicaciones
    case READ_UBICACIONES = 'Ver Ubicación';
    case CREATE_UBICACIONES = 'Crear Ubicación';
    case UPDATE_UBICACIONES = 'Actualizar Ubicación';
    case DELETE_UBICACIONES = 'Eliminar Ubicación';

    // Paises
    case READ_PAISES = 'Ver País';
    case CREATE_PAISES = 'Crear País';
    case UPDATE_PAISES = 'Actualizar País';
    case DELETE_PAISES = 'Eliminar País';

    // Territorios
    case READ_TERRITORIOS = 'Ver Territorio';
    case CREATE_TERRITORIOS = 'Crear Territorio';
    case UPDATE_TERRITORIOS = 'Actualizar Territorio';
    case DELETE_TERRITORIOS = 'Eliminar Territorio';

    // Direcciones
    case READ_DIRECCIONES = 'Ver Dirección';
    case CREATE_DIRECCIONES = 'Crear Dirección';
    case UPDATE_DIRECCIONES = 'Actualizar Dirección';
    case DELETE_DIRECCIONES = 'Eliminar Dirección';

    // Categorías de Incidencias
    case READ_CATEGORIAS_INCIDENCIA = 'Ver Categoría de Incidencia';
    case CREATE_CATEGORIAS_INCIDENCIA = 'Crear Categoría de Incidencia';
    case UPDATE_CATEGORIAS_INCIDENCIA = 'Actualizar Categoría de Incidencia';
    case DELETE_CATEGORIAS_INCIDENCIA = 'Eliminar Categoría de Incidencia';

    // Incidencias
    case READ_INCIDENCIAS = 'Ver Incidencia';
    case CREATE_INCIDENCIAS = 'Crear Incidencia';
    case UPDATE_INCIDENCIAS = 'Actualizar Incidencia';
    case DELETE_INCIDENCIAS = 'Eliminar Incidencia';

    // Instituciones
    case READ_INSTITUCIONES = 'Ver Institución';
    case CREATE_INSTITUCIONES = 'Crear Institución';
    case UPDATE_INSTITUCIONES = 'Actualizar Institución';
    case DELETE_INSTITUCIONES = 'Eliminar Institución';

    // Despacho de Incidencias
    case READ_DESPACHO_INCIDENCIAS = 'Ver Despacho de Incidencia';
    case CREATE_DESPACHO_INCIDENCIAS = 'Crear Despacho de Incidencia';
    case UPDATE_DESPACHO_INCIDENCIAS = 'Actualizar Despacho de Incidencia';
    case DELETE_DESPACHO_INCIDENCIAS = 'Eliminar Despacho de Incidencia';
}
