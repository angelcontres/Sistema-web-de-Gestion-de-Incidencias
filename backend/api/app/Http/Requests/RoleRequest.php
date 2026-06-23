<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RoleRequest extends FormRequest
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
        if (str_contains($this->path(), 'permisos')) {
            return [
                'permisos' => 'array',
                'permisos.*' => 'integer|exists:permisos,id',
            ];
        }

        return [
            //
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:255',
            'padre_id' => 'nullable|integer|exists:roles,id',
        ];
    }
}
