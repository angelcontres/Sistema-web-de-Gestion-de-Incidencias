<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class OpcionMenuRequest extends FormRequest
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
            'nombre' => 'required|string|max:50',
            'icono' => 'nullable|string|max:50',
            'ruta' => 'required|string|max:255',
            'padre_id' => 'nullable|exists:opciones_menu,id',
        ];

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $rules['nombre'] = 'sometimes|required|string|max:50';
            $rules['ruta'] = 'sometimes|required|string|max:255';
        }

        return $rules;
    }
}
