<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PrioridadRequest extends FormRequest
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
        $prioridadId = $this->route('prioridad') ?? $this->route('prioridades');

        if ($isUpdate) {
            return [
                'nombre' => 'sometimes|required|string|max:255|unique:prioridades,nombre,'.$prioridadId,
                'color_hex' => 'sometimes|required|string|max:7',
            ];
        }

        return [
            'nombre' => 'required|string|max:255|unique:prioridades,nombre',
            'color_hex' => 'required|string|max:7',
        ];
    }
}
