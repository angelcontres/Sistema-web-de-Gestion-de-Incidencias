<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Require 'Crear Usuario' permission for POST (create)
        if ($this->isMethod('post')) {
            return $this->user() && $this->user()->hasPermission('Crear Usuario');
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('usuario') ?? $this->route('user'); // Handle update route uniqueness bypass

        return [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username' . ($userId ? ',' . $userId : ''),
            'email' => 'required|email|max:255|unique:users,email' . ($userId ? ',' . $userId : ''),
            'password' => $userId ? 'nullable|string|min:8' : 'required|string|min:8', // password optional on update
            'activo' => 'nullable|boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'integer|exists:roles,id',
        ];
    }
}
