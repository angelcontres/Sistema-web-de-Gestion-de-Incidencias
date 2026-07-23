<?php

namespace App\Enums;

enum TipoTerritorio: string
{
    case DEPARTAMENTO = 'Departamento';
    case PROVINCIA = 'Provincia';
    case DISTRITO = 'Distrito';
    case ESTADO = 'Estado';
    case ALCALDIA = 'Alcaldía';
    case MUNICIPIO = 'Municipio';
    case CANTON = 'Cantón';
    case PARROQUIA = 'Parroquia';
}
