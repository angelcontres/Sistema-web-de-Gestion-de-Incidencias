<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DireccionesRequest extends FormRequest
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

        return [
            'territorio_id' => ($isUpdate ? 'sometimes|' : '') . 'required|exists:territorios,id',
            'detalle' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'referencia' => 'nullable|string|max:255',
            'codigo_postal' => 'nullable|string|max:20',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ];
    }
}

