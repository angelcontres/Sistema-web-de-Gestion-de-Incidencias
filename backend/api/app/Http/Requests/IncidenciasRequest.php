<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IncidenciasRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'incidencia_descripcion' => 'nullable|string',
            'direccion_id' => 'nullable|integer|exists:direcciones,id',
            'tipo_incidencia_id' => ($this->isMethod('post') ? 'required' : 'sometimes|required').'|integer|exists:categorias_incidencia,id',
            'sub_tipo_incidencia_id' => ($this->isMethod('post') ? 'required' : 'sometimes|required').'|integer|exists:categorias_incidencia,id',
            'cantidad_afectados_incidencia' => 'nullable|integer|min:0',
            'institucion_id' => 'nullable|integer|exists:instituciones,id',

            'recursos' => 'nullable|array',
            'recursos.*' => 'string', // Cada elemento debe ser el string en base64
        ];

        // For updates, we validate the version for optimistic locking
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $rules['version'] = 'required|integer';
            $rules['estado_id'] = 'nullable|integer|exists:estados_incidencia,id';
        }

        return $rules;
    }
}
