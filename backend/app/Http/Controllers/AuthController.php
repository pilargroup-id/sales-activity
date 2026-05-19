<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\CentralUser;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = CentralUser::where('username', $request->username)
            ->where('is_active', 1)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Ambil semua departments user (many-to-many)
        $departments = DB::connection('pilargroup')
            ->table('central_user_departments as cud')
            ->join('master_departments as md', 'cud.department_id', '=', 'md.id')
            ->where('cud.user_id', $user->id)
            ->select(
                'md.id as department_id',
                'md.name as department_name',
                'md.code as department_code',
                'md.company_id',
                'cud.is_primary'
            )
            ->get();

        // Ambil semua companies user (many-to-many)
        $companies = DB::connection('pilargroup')
            ->table('central_user_companies as cuc')
            ->join('master_companies as mc', 'cuc.company_id', '=', 'mc.id')
            ->where('cuc.user_id', $user->id)
            ->select(
                'mc.id as company_id',
                'mc.name as company_name',
                'mc.code as company_code',
                'cuc.is_primary'
            )
            ->get();

        // Filter akses: kombinasi dept + company
        // Allowed: dept name tertentu ATAU company tertentu
        $allowedDeptNames   = ['Gosave GT', 'IT', 'Board Of Director'];
        $allowedCompanyCodes = ['comp-pnm-0001']; // sesuaikan kebutuhan

        $deptNames    = $departments->pluck('department_name')->toArray();
        $companyCodes = $companies->pluck('company_id')->toArray();

        $deptAllowed    = !empty(array_intersect($deptNames, $allowedDeptNames));
        $companyAllowed = !empty(array_intersect($companyCodes, $allowedCompanyCodes));

        if (!$deptAllowed || !$companyAllowed) {
            return response()->json(['message' => 'Access denied for your department or company'], 403);
        }

        // Cek akses project touchpoint
        $apps = DB::connection('pilargroup')
            ->table('central_user_projects as cup')
            ->join('master_projects as mp', 'cup.project_id', '=', 'mp.id')
            ->where('cup.user_id', $user->id)
            ->pluck('mp.slug')
            ->toArray();

        if (!in_array('touchpoint', $apps)) {
            return response()->json(['message' => 'Access denied for this application'], 403);
        }

        // Primary dept & company untuk convenience di frontend
        $primaryDept    = $departments->firstWhere('is_primary', 1) ?? $departments->first();
        $primaryCompany = $companies->firstWhere('is_primary', 1) ?? $companies->first();

        // Build JWT dengan claims lengkap
        $token = JWTAuth::claims([
            'apps'              => $apps,
            'departments'       => $departments->toArray(),
            'companies'         => $companies->toArray(),
            'primary_dept_id'   => $primaryDept?->department_id,
            'primary_dept_name' => $primaryDept?->department_name,
            'primary_company_id'=> $primaryCompany?->company_id,
        ])->fromUser($user);

        $userData = [
            'id'              => $user->id,
            'internal_id'     => $user->internal_id,
            'username'        => $user->username,
            'name'            => $user->name,
            'job_position'    => $user->job_position,
            'job_level_id'    => $user->job_level_id,
            'departments'     => $departments,
            'companies'       => $companies,
            'primary_dept'    => $primaryDept,
            'primary_company' => $primaryCompany,
            'apps'            => $apps,
        ];

        return response()->json([
            'token' => $token,
            'user'  => $userData,
            'sales' => $userData, // backward compat
        ]);
    }

    public function me(Request $request)
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $departments = DB::connection('pilargroup')
            ->table('central_user_departments as cud')
            ->join('master_departments as md', 'cud.department_id', '=', 'md.id')
            ->where('cud.user_id', $user->id)
            ->select(
                'md.id as department_id',
                'md.name as department_name',
                'md.code as department_code',
                'md.company_id',
                'cud.is_primary'
            )
            ->get();

        $companies = DB::connection('pilargroup')
            ->table('central_user_companies as cuc')
            ->join('master_companies as mc', 'cuc.company_id', '=', 'mc.id')
            ->where('cuc.user_id', $user->id)
            ->select(
                'mc.id as company_id',
                'mc.name as company_name',
                'mc.code as company_code',
                'cuc.is_primary'
            )
            ->get();

        $primaryDept    = $departments->firstWhere('is_primary', 1) ?? $departments->first();
        $primaryCompany = $companies->firstWhere('is_primary', 1) ?? $companies->first();

        return response()->json([
            'id'              => $user->id,
            'internal_id'     => $user->internal_id,
            'username'        => $user->username,
            'name'            => $user->name,
            'job_position'    => $user->job_position,
            'job_level_id'    => $user->job_level_id,
            'departments'     => $departments,
            'companies'       => $companies,
            'primary_dept'    => $primaryDept,
            'primary_company' => $primaryCompany,
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out successfully']);
    }
}