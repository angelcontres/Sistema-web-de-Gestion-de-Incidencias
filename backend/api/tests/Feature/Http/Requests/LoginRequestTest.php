<?php

namespace Tests\Feature\Http\Requests;

use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class LoginRequestTest extends TestCase
{
    public function test_authorize_returns_true()
    {
        $request = new LoginRequest;
        $this->assertTrue($request->authorize());
    }

    public function test_rules_validation()
    {
        $request = new LoginRequest;
        $rules = $request->rules();

        $validator = Validator::make([
            'login' => '',
            'password' => 'short',
        ], $rules);

        $this->assertTrue($validator->fails());
        $this->assertTrue($validator->errors()->has('login'));
        $this->assertTrue($validator->errors()->has('password'));

        $validatorValid = Validator::make([
            'login' => 'valid@example.com',
            'password' => 'password123',
        ], $rules);

        $this->assertFalse($validatorValid->fails());
    }
}
