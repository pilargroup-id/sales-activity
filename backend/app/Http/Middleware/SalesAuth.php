<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class SalesAuth
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();

            $apps = (array) ($payload->get('apps') ?? []);
            if (!in_array('touchpoint', $apps)) {
                return response()->json(['message' => 'Access denied for this application'], 403);
            }

            // Backward compatible dengan code lama
            $request->merge([
                'auth_user'         => $payload->toArray(),
                'sales_internal_id' => $payload->get('internal_id'),
                'sales_name'        => $payload->get('name'),
                'user_id'           => $payload->get('sub'),
                'username'          => $payload->get('username'),
                'department'        => $payload->get('primary_dept_name'),
                'department_id'     => $payload->get('primary_dept_id'),
                'company_id'        => $payload->get('primary_company_id'),
                'departments'       => $payload->get('departments'), // full list kalau butuh
                'companies'         => $payload->get('companies'),
            ]);

        } catch (TokenExpiredException $e) {
            return response()->json(['message' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['message' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}