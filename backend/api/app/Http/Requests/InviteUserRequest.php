<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Role;

class InviteUserRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255|unique:users,email|unique:user_invitations,email',
            'name' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id',
            'institution_id' => [
                'nullable',
                'exists:instituciones,id',
                function ($attribute, $value, $fail) {
                    $role = Role::find($this->role_id);
                    if ($role && $role->nombre === 'Institucion' && empty($value)) {
                        $fail('La institución es requerida para el rol de Institución.');
                    }
                },
            ],
        ];
    }
}
