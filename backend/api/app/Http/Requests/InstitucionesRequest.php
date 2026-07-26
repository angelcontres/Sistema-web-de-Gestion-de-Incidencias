<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
                'nombre' => ['sometimes', 'required', 'string', 'max:255', $this->uniqueRule('nombre', $institucionId)],
                'siglas' => ['sometimes', 'required', 'string', 'max:50', $this->uniqueRule('siglas', $institucionId)],
                'activo' => 'sometimes|boolean',
            ];
        }

        return [
            'nombre' => ['required', 'string', 'max:255', $this->uniqueRule('nombre')],
            'siglas' => ['required', 'string', 'max:50', $this->uniqueRule('siglas')],
            'activo' => 'boolean',
        ];
    }

    /**
     * Genera la regla de unicidad ignorando registros en papelera (Soft Deletes).
     */
    private function uniqueRule(string $column, $ignoreId = null)
    {
        $rule = Rule::unique('instituciones', $column)->whereNull('deleted_at');
        if ($ignoreId) {
            $rule->ignore($ignoreId);
        }

        return $rule;
    }
}
