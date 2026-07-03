<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class InstitucionesRequest extends FormRequest
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
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        // El parámetro de ruta modificado en api.php es 'institucion'
        $institucionId = $this->route('institucion');

        if ($isUpdate) {
            return [
                'nombre' => 'sometimes|required|string|max:255|unique:instituciones,nombre,'.$institucionId,
                'siglas' => 'sometimes|required|string|max:50|unique:instituciones,siglas,'.$institucionId,
                'activo' => 'sometimes|boolean',
            ];
        }

        return [
            'nombre' => 'required|string|max:255|unique:instituciones,nombre',
            'siglas' => 'required|string|max:50|unique:instituciones,siglas',
            'activo' => 'boolean',
        ];
    }
}
